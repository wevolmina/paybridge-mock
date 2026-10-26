import type {Pool} from 'mysql2/promise';
import {z} from 'zod';
import {configuredAdminOrigin} from './admin-http';
import {createInquiryInput,inquiryActionInput,InquiryError} from './inquiry-domain';
import {listInquiries,createInquiry,actOnInquiry,type StaffActor} from './inquiries';
type Identity={uid:string;claims:{firebase?:{sign_in_provider?:string}}};
type Mode='customer'|'merchant'|'admin';
type Dependencies={identity:(r:Request)=>Promise<Identity|null>;staff:(r:Request,role:'merchant'|'admin')=>Promise<{uid:string;merchantId:string}|null>;pool:()=>Pool;adminOrigin?:string;list?:typeof listInquiries;create?:typeof createInquiry;act?:typeof actOnInquiry};
export function inquiryHandlers(mode:Mode,deps:Dependencies){
 function allowed(r:Request){const o=r.headers.get('origin');return !o?r.method==='GET':o===new URL(r.url).origin||o===configuredAdminOrigin(deps.adminOrigin)||mode==='customer'&&['https://paybridge-mock.web.app','https://paybridge-mock.firebaseapp.com'].includes(o);}
 function headers(r:Request):Record<string,string>{const o=r.headers.get('origin');return {'Cache-Control':'private, no-store',Vary:'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type',...(o&&allowed(r)?{'Access-Control-Allow-Origin':o}:{})};}
 function fail(r:Request,e:unknown){const err=e instanceof InquiryError?e:new InquiryError('INQUIRY_UNAVAILABLE',503);return Response.json({error:err.code},{status:err.status,headers:headers(r)});}
 async function handle(r:Request){
  if(!allowed(r))return fail(r,new InquiryError('ORIGIN_NOT_ALLOWED',403));
  try{
   let uid:string,actor:StaffActor|null=null;
   if(mode==='customer'){const user=await deps.identity(r);if(!user)throw new InquiryError('SIGN_IN_REQUIRED',401);if(user.claims.firebase?.sign_in_provider==='anonymous')throw new InquiryError('ACCOUNT_LOGIN_REQUIRED',403);uid=user.uid;}
   else{const staff=await deps.staff(r,mode);if(!staff)throw new InquiryError('STAFF_REQUIRED',403);actor={...staff,role:mode};uid=staff.uid;}
   if(r.method==='GET'){
    const params=new URL(r.url).searchParams,before=params.get('before');
    if(before&&!z.string().uuid().safeParse(before).success)throw new InquiryError('INVALID_INPUT');
    return Response.json(await (deps.list||listInquiries)(deps.pool(),uid,actor,before||undefined),{headers:headers(r)});
   }
   if(r.method!=='POST')return fail(r,new InquiryError('METHOD_NOT_ALLOWED',405));
   if(!r.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new InquiryError('INVALID_INPUT');
   const reader=r.body?.getReader();if(!reader)throw new InquiryError('INVALID_INPUT');
   const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>20000){await reader.cancel();throw new InquiryError('INPUT_TOO_LARGE',413);}chunks.push(value);}
   let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new InquiryError('INVALID_INPUT');}
   if(mode==='customer'){
    const parsed=createInquiryInput.safeParse(raw);if(!parsed.success)throw new InquiryError('INVALID_INPUT');
    return Response.json(await (deps.create||createInquiry)(deps.pool(),uid,parsed.data),{status:201,headers:headers(r)});
   }
   const parsed=inquiryActionInput.safeParse(raw);if(!parsed.success)throw new InquiryError('INVALID_INPUT');
   // Authorize before any costly AI request; DB mutation rechecks membership under lock.
   if(['manage','approve'].includes(parsed.data.action)&&mode!=='admin')throw new InquiryError('ADMIN_REQUIRED',403);
   return Response.json(await (deps.act||actOnInquiry)(deps.pool(),actor!,parsed.data),{headers:headers(r)});
  }catch(e){return fail(r,e);}
 }
 return {GET:handle,POST:handle,OPTIONS(r:Request){const method=r.headers.get('access-control-request-method');const names=(r.headers.get('access-control-request-headers')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);return new Response(null,{status:!!r.headers.get('origin')&&allowed(r)&&['GET','POST'].includes(method||'')&&names.every(x=>['authorization','content-type'].includes(x))?204:403,headers:headers(r)});}};
}
