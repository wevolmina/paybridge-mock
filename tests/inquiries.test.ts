import test from 'node:test';
import assert from 'node:assert/strict';
import type {Pool} from 'mysql2/promise';
import {classifyInquiry,createInquiryInput,inquiryActionInput,assertCanPublish,templateDraft} from '../apps/merchant/lib/inquiry-domain';
import {inquiryHandlers} from '../apps/merchant/lib/inquiries-http';
import {actOnInquiry,listInquiries} from '../apps/merchant/lib/inquiries';
import {aiDraft} from '../apps/merchant/lib/inquiry-ai';
const id='f3b7137a-a279-4995-9554-ad5befce3a43';
const actor={uid:'staff-a',merchantId:'shop-a',role:'admin' as const};
const record={id,merchant_id:'shop-a',customer_uid:'customer-a',product_id:'bedroom-lighting',subject:'설치 문의',body:'설치 가능 여부가 궁금합니다',category:'product',status:'open',draft:'직원이 작성한 답변입니다',approved_by:null as string|null,approved_at:null as string|null,version:1,assignee_uid:null,created_at:'2026-10-27 00:00:00',updated_at:'2026-10-27 00:00:00'};
function database(initial={...record}){
 let row={...initial};let backup={...row};let replies:unknown[][]=[];let committed=0;let mutations=0;
 const db={
  async beginTransaction(){backup={...row}},async commit(){committed++},async rollback(){row={...backup}},release(){},
  async execute(sql:string,values:unknown[]=[]):Promise<unknown[]> {
   if(sql.startsWith('SELECT user_uid FROM staff_memberships'))return [[{user_uid:actor.uid}]];
   if(sql.startsWith('SELECT * FROM inquiries WHERE id='))return [row.id===values[0]&&row.merchant_id===values[1]?[{...row}]:[]];
   if(sql.startsWith('SELECT category,version'))return [[{category:row.category,version:row.version}]];
   if(sql.startsWith('UPDATE inquiries SET draft=?')){mutations++;row.draft=String(values[0]);row.approved_by=null;row.approved_at=null;row.version++;return [{}];}
   if(sql.startsWith('UPDATE inquiries SET approved_by=')){mutations++;row.approved_by=String(values[0]);row.approved_at='2026-10-27 00:00:01';row.version++;return [{}];}
   if(sql.startsWith('UPDATE inquiries SET draft=NULL')){mutations++;row.draft='';row.approved_by=null;row.approved_at=null;row.status='waiting_customer';row.version++;return [{}];}
   if(sql.startsWith('UPDATE inquiries SET status=')){mutations++;row.status=String(values[0]);row.category=String(values[1]);row.draft='';row.approved_by=null;row.approved_at=null;row.version++;return [{}];}
   if(sql.startsWith('INSERT INTO inquiry_replies')){replies.push(values);return [{}];}
   if(sql.startsWith('INSERT INTO inquiry_audit'))return [{}];
   throw Error('Unexpected test SQL: '+sql);
  },async getConnection(){return db},
 };
 return {pool:db as unknown as Pool,get:()=>({...row}),replies:()=>replies,mutations:()=>mutations,commits:()=>committed};
}
test('classification separates purchase metadata from request intent and routes mixed intents',()=>{
 assert.equal(classifyInquiry('비회원 주문 내역 조회'),'order_lookup');assert.equal(classifyInquiry('톡체크아웃 비회원 반품하고 싶어요'),'returns');assert.equal(classifyInquiry('배송지를 변경해주세요'),'order_change');assert.equal(classifyInquiry('반품과 주문 취소'),'complex');assert.equal(classifyInquiry('이 센서 호환되나요'),'product');assert.equal(classifyInquiry('안녕하세요'),'other');
});
test('intake rejects forged owner/store/status, oversized body and arbitrary actions',()=>{
 const good={requestId:id,productId:'bedroom-lighting',subject:'문의입니다',body:'설치가 가능한가요'};
 assert(createInquiryInput.safeParse(good).success);for(const extra of [{customerUid:'other'},{merchantId:'other'},{status:'resolved'}])assert(!createInquiryInput.safeParse({...good,...extra}).success);
 assert(!createInquiryInput.safeParse({...good,body:'x'.repeat(3001)}).success);assert(!inquiryActionInput.safeParse({id,version:1,action:'refund'}).success);
});
test('publishing requires approval, approved content is consumed once, stale duplicate is rejected',async()=>{
 const d=database();await assert.rejects(actOnInquiry(d.pool,actor,{id,version:1,action:'publish'}),/APPROVAL_REQUIRED/);assert.equal(d.mutations(),0);
 await actOnInquiry(d.pool,actor,{id,version:1,action:'approve'});await actOnInquiry(d.pool,actor,{id,version:2,action:'publish'});assert.equal(d.replies().length,1);assert.equal(d.replies()[0][1],record.draft);assert.equal(d.get().draft,'');
 await assert.rejects(actOnInquiry(d.pool,actor,{id,version:2,action:'publish'}),/VERSION_CONFLICT/);assert.equal(d.replies().length,1);
});
test('draft changes and management changes revoke approval; stale approvals fail',async()=>{
 const d=database({...record,approved_by:'admin',approved_at:'2026-10-27 00:00:00'});
 await actOnInquiry(d.pool,actor,{id,version:1,action:'draft',body:'수정한 답변 내용입니다'});assert.equal(d.get().approved_by,null);
 await assert.rejects(actOnInquiry(d.pool,actor,{id,version:1,action:'approve'}),/VERSION_CONFLICT/);
 await actOnInquiry(d.pool,actor,{id,version:2,action:'manage',status:'in_progress',category:'product',assigneeUid:null});assert.equal(d.get().draft,'');assert.equal(d.get().approved_by,null);
});
test('cross-store mutations do not reveal or change another store inquiry',async()=>{
 const d=database();await assert.rejects(actOnInquiry(d.pool,{...actor,merchantId:'other'},{id,version:1,action:'draft',body:'다른 상점의 답변입니다'}),/INQUIRY_NOT_FOUND/);assert.equal(d.mutations(),0);
});
test('merchant cannot approve or assign even through direct domain calls',async()=>{
 const d=database();await assert.rejects(actOnInquiry(d.pool,{...actor,role:'merchant'},{id,version:1,action:'approve'}),/ADMIN_REQUIRED/);assert.equal(d.mutations(),0);
});
test('customer list scopes SQL to authenticated UID and strips private draft and approval metadata',async()=>{
 const calls:{sql:string;values:unknown[]}[]=[];
 const db={async execute(sql:string,values:unknown[]){calls.push({sql,values});return [sql.startsWith('SELECT *')?[{...record,approved_by:'secret-admin'}]:[]]}} as unknown as Pool;
 const result=await listInquiries(db,'customer-a',null);assert(calls[0].sql.includes('WHERE customer_uid=?'));assert.equal(calls[0].values[0],'customer-a');assert(!('draft' in result.inquiries[0]));assert(!('approved' in result.inquiries[0]));assert(!('customer_uid' in result.inquiries[0]));assert(!('assigneeUid' in result.inquiries[0]));
});
function handlers(mode:'customer'|'merchant'|'admin',options:{anonymous?:boolean;signedIn?:boolean}={}){
 const calls:string[]=[];
 const h=inquiryHandlers(mode,{identity:async()=>options.signedIn===false?null:{uid:'customer-a',claims:{firebase:{sign_in_provider:options.anonymous?'anonymous':'google.com'}}},staff:async()=>({...actor}),pool:()=>({} as Pool),adminOrigin:'https://admin.example',list:async(_db,uid,staff)=>{calls.push(staff?staff.merchantId:uid);return {inquiries:[],assignees:[],nextCursor:null}},create:async(_db,uid)=>{calls.push(uid);return {id}},act:async()=>{calls.push('mutated');return {ok:true}}});return {h,calls};
}
function request(body:unknown,origin='https://paybridge-mock.web.app'){return new Request('https://api.example/api/inquiries',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('HTTP requires identity, rejects guest identities and never accepts caller owner fields',async()=>{
 const body={requestId:id,productId:'bedroom-lighting',subject:'문의합니다',body:'상세 문의 내용입니다'};
 assert.equal((await handlers('customer',{signedIn:false}).h.POST(request(body))).status,401);assert.equal((await handlers('customer',{anonymous:true}).h.POST(request(body))).status,403);
 const d=handlers('customer');assert.equal((await d.h.POST(request({...body,customerUid:'other'}))).status,400);assert.equal(d.calls.length,0);assert.equal((await d.h.POST(request(body))).status,201);assert.deepEqual(d.calls,['customer-a']);
});
test('HTTP protects origins, preflight, request size and admin-only actions',async()=>{
 const c=handlers('customer');assert.equal((await c.h.POST(request({},'https://evil.example'))).status,403);assert.equal((await c.h.POST(request({body:'x'.repeat(21000)}))).status,413);
 const pre=new Request('https://api.example/api/inquiries',{method:'OPTIONS',headers:{origin:'https://paybridge-mock.web.app','access-control-request-method':'POST','access-control-request-headers':'authorization,content-type'}});assert.equal(c.h.OPTIONS(pre).status,204);
 const merchant=handlers('merchant');assert.equal((await merchant.h.POST(request({id,version:1,action:'approve'},'https://api.example'))).status,403);assert.equal(merchant.calls.length,0);
});
test('AI is explicitly opt-in; only category/generic guidance are sent; no execution tools',async()=>{
 await assert.rejects(aiDraft('returns',{}),/AI_NOT_CONFIGURED/);let payload:any;
 const send=(async(_url:unknown,init:RequestInit)=>{payload=JSON.parse(String(init.body));return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'교환·반품 요청 내용을 확인한 뒤 안내드리겠습니다.'}]}]});}) as typeof fetch;
 const reply=await aiDraft('returns',{INQUIRY_AI_ENABLED:'true',OPENAI_API_KEY:'test-key',INQUIRY_AI_MODEL:'test-model'},send);
 assert.equal(payload.store,false);assert.equal(payload.tools,undefined);assert.deepEqual(Object.keys(JSON.parse(payload.input)).sort(),['category','guidance']);assert(reply.includes('실행되지는 않습니다'));assert(!templateDraft('returns').includes('10시'));
 assert.throws(()=>assertCanPublish({draft:'x',approved_by:null,approved_at:null}),/APPROVAL_REQUIRED/);
});
