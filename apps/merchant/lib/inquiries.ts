import {createHash,randomUUID} from 'node:crypto';
import type {Pool,RowDataPacket,PoolConnection} from 'mysql2/promise';
import {InquiryError,createInquiryInput,inquiryActionInput,classifyInquiry,templateDraft,assertCanPublish} from './inquiry-domain';
import {aiDraft} from './inquiry-ai';
export type StaffActor={uid:string;merchantId:string;role:'admin'|'merchant'};
type Sql=Pick<Pool,'execute'>|Pick<PoolConnection,'execute'>;
function view(row:RowDataPacket,staff:boolean){
 const common={id:row.id,productId:row.product_id,subject:row.subject,body:row.body,category:row.category,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at};
 return staff?{...common,version:row.version,assigneeUid:row.assignee_uid,draft:row.draft||'',draftSource:row.draft_source,approved:!!row.approved_by,approvedAt:row.approved_at}:common;
}
export async function listInquiries(db:Sql,uid:string,actor:StaffActor|null,before?:string){
 const scope=actor?'merchant_id=?':'customer_uid=?';const who=actor?actor.merchantId:uid;
 let boundary:RowDataPacket|undefined;
 if(before){const [r]=await db.execute<RowDataPacket[]>(`SELECT created_at,id FROM inquiries WHERE ${scope} AND id=?`,[who,before]);boundary=r[0];if(!boundary)throw new InquiryError('INVALID_CURSOR');}
 const [rows]=await db.execute<RowDataPacket[]>(`SELECT * FROM inquiries WHERE ${scope}${boundary?' AND (created_at<? OR (created_at=? AND id<?))':''} ORDER BY created_at DESC,id DESC LIMIT 31`,boundary?[who,boundary.created_at,boundary.created_at,boundary.id]:[who]);
 const selected=rows.slice(0,30);let replies:RowDataPacket[]=[];
 if(selected.length){const [r]=await db.execute<RowDataPacket[]>(`SELECT inquiry_id,body,published_at FROM inquiry_replies WHERE inquiry_id IN (${selected.map(()=>'?').join(',')}) ORDER BY id ASC`,selected.map(x=>x.id));replies=r;}
 let staff:RowDataPacket[]=[];
 if(actor?.role==='admin'){const [r]=await db.execute<RowDataPacket[]>('SELECT user_uid FROM staff_memberships WHERE merchant_id=? AND role=\'merchant\' AND active=TRUE ORDER BY user_uid',[actor.merchantId]);staff=r;}
 return {inquiries:selected.map(r=>({...view(r,!!actor),replies:replies.filter(x=>x.inquiry_id===r.id).map(x=>({body:x.body,publishedAt:x.published_at}))})),nextCursor:rows.length>30?selected.at(-1)!.id:null,assignees:staff.map(x=>x.user_uid)};
}
export async function createInquiry(pool:Pool,uid:string,input:ReturnType<typeof createInquiryInput.parse>){
 const c=await pool.getConnection();
 try{await c.beginTransaction();
 // The per-account DB advisory lock serializes intake without locking product reads globally.
 const lock='inquiry:'+createHash('sha256').update(uid).digest('hex').slice(0,50);
 const [locks]=await c.execute<RowDataPacket[]>('SELECT GET_LOCK(?,3) AS acquired',[lock]);
 if(Number(locks[0]?.acquired)!==1)throw new InquiryError('TRY_LATER',429);
 try{
 const [old]=await c.execute<RowDataPacket[]>('SELECT * FROM inquiries WHERE customer_uid=? AND request_id=? FOR UPDATE',[uid,input.requestId]);
 if(old.length){const row=old[0];if(row.product_id!==input.productId||row.subject!==input.subject||row.body!==input.body)throw new InquiryError('REQUEST_CONFLICT',409);await c.commit();return {id:row.id};}
 const [recent]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS count FROM inquiries WHERE customer_uid=? AND created_at>DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 HOUR)',[uid]);
 if(Number(recent[0]?.count)>=10)throw new InquiryError('TRY_LATER',429);
 const [products]=input.productId==='general'
  ?await c.execute<RowDataPacket[]>('SELECT DISTINCT merchant_id FROM packages ORDER BY merchant_id LIMIT 2')
  :await c.execute<RowDataPacket[]>('SELECT merchant_id FROM packages WHERE product_id=?',[input.productId]);
 if(input.productId==='general'&&products.length!==1)throw new InquiryError('STORE_SELECTION_REQUIRED',409);
 if(!products[0])throw new InquiryError('PRODUCT_NOT_FOUND',404);
 const id=randomUUID(),category=classifyInquiry(input.subject+' '+input.body);
 await c.execute('INSERT INTO inquiries(id,customer_uid,request_id,merchant_id,product_id,subject,body,category) VALUES(?,?,?,?,?,?,?,?)',[id,uid,input.requestId,products[0].merchant_id,input.productId,input.subject,input.body,category]);
 await c.execute('INSERT INTO inquiry_audit(inquiry_id,actor_uid,action,version) VALUES(?,?,\'created\',1)',[id,uid]);
 await c.commit();return {id};
 }finally{await c.execute('SELECT RELEASE_LOCK(?)',[lock]);}
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
export async function actOnInquiry(pool:Pool,actor:StaffActor,input:ReturnType<typeof inquiryActionInput.parse>,generate=aiDraft){
 let suggestion:string|undefined;
 if(input.action==='suggest'){
 const [rows]=await pool.execute<RowDataPacket[]>('SELECT category,version FROM inquiries WHERE id=? AND merchant_id=?',[input.id,actor.merchantId]);
 if(!rows[0])throw new InquiryError('INQUIRY_NOT_FOUND',404);
 if(rows[0].version!==input.version)throw new InquiryError('VERSION_CONFLICT',409);
 suggestion=input.engine==='ai'?await generate(rows[0].category):templateDraft(rows[0].category);
 }
 const c=await pool.getConnection();try{await c.beginTransaction();
 // Lock memberships too: a revoked actor cannot mutate a stale open screen.
 const [members]=await c.execute<RowDataPacket[]>('SELECT user_uid FROM staff_memberships WHERE user_uid=? AND merchant_id=? AND role=? AND active=TRUE FOR SHARE',[actor.uid,actor.merchantId,actor.role]);
 if(!members.length)throw new InquiryError('STAFF_REQUIRED',403);
 const [rows]=await c.execute<RowDataPacket[]>('SELECT * FROM inquiries WHERE id=? AND merchant_id=? FOR UPDATE',[input.id,actor.merchantId]);
 const row=rows[0];if(!row)throw new InquiryError('INQUIRY_NOT_FOUND',404);
 if(row.version!==input.version)throw new InquiryError('VERSION_CONFLICT',409);
 if(input.action==='manage'){
 if(actor.role!=='admin')throw new InquiryError('ADMIN_REQUIRED',403);
 if(input.assigneeUid){const [target]=await c.execute<RowDataPacket[]>('SELECT user_uid FROM staff_memberships WHERE user_uid=? AND merchant_id=? AND role=\'merchant\' AND active=TRUE FOR SHARE',[input.assigneeUid,actor.merchantId]);if(!target.length)throw new InquiryError('ASSIGNEE_NOT_ALLOWED',400);}
 await c.execute('UPDATE inquiries SET status=?,category=?,assignee_uid=?,approved_by=NULL,approved_at=NULL,draft=NULL,draft_source=NULL,version=version+1 WHERE id=?',[input.status,input.category,input.assigneeUid,input.id]);
 }else if(input.action==='draft'||input.action==='suggest'){
 if(row.status==='closed')throw new InquiryError('INQUIRY_CLOSED',409);
 await c.execute('UPDATE inquiries SET draft=?,draft_source=?,approved_by=NULL,approved_at=NULL,version=version+1 WHERE id=?',[input.action==='draft'?input.body:suggestion!,input.action==='draft'?'staff':input.engine==='ai'?'ai':'template',input.id]);
 }else if(input.action==='approve'){
 if(actor.role!=='admin')throw new InquiryError('ADMIN_REQUIRED',403);
 if(row.status==='closed'||!row.draft?.trim())throw new InquiryError('DRAFT_REQUIRED',409);
 await c.execute('UPDATE inquiries SET approved_by=?,approved_at=UTC_TIMESTAMP(3),version=version+1 WHERE id=?',[actor.uid,input.id]);
 }else{
 if(row.status==='closed')throw new InquiryError('INQUIRY_CLOSED',409);assertCanPublish({draft:row.draft,approved_by:row.approved_by,approved_at:row.approved_at});
 // The exact approved draft is copied under the same row lock, and consumed once.
 await c.execute('INSERT INTO inquiry_replies(inquiry_id,body,approved_by,published_by) VALUES(?,?,?,?)',[input.id,row.draft,row.approved_by,actor.uid]);
 await c.execute('UPDATE inquiries SET draft=NULL,draft_source=NULL,approved_by=NULL,approved_at=NULL,status=\'waiting_customer\',version=version+1 WHERE id=?',[input.id]);
 }
 await c.execute('INSERT INTO inquiry_audit(inquiry_id,actor_uid,action,version) VALUES(?,?,?,?)',[input.id,actor.uid,input.action,input.version+1]);
 await c.commit();return {ok:true};
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
