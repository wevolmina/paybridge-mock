import {InquiryError,templateDraft,type Category,categoryLabels} from './inquiry-domain';
// Only the closed category and generic demo policy are sent. No inquiry text/UID/email/order ID.
export async function aiDraft(category:Category,env=process.env,send:typeof fetch=fetch){
 if(env.INQUIRY_AI_ENABLED!=='true'||!env.OPENAI_API_KEY||!env.INQUIRY_AI_MODEL)throw new InquiryError('AI_NOT_CONFIGURED',503);
 const r=await send('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.INQUIRY_AI_MODEL,store:false,max_output_tokens:1200,instructions:'한국어 고객문의 답변 초안을 작성하라. 주어진 일반 안내만 자연스럽게 다듬어라. 날짜, 비용, 정책, 주문 상태를 추가하지 마라. 처리 완료를 약속하지 마라. 도구를 사용하지 마라. 직원이 검토할 초안이다.',input:JSON.stringify({category:categoryLabels[category],guidance:templateDraft(category)})}),signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new InquiryError('AI_UNAVAILABLE',503);
 const result=await r.json();
 const text=(result.output||[]).filter((x:{type:string})=>x.type==='message').flatMap((x:{content?:{type:string;text?:string}[]})=>x.content||[]).filter((x:{type:string})=>x.type==='output_text').map((x:{text:string})=>x.text).join('\n').trim();
 if(result.status!=='completed'||text.length<5||text.length>3500)throw new InquiryError('AI_UNAVAILABLE',503);
 return text+'\n\n직원이 확인 후 공개하는 답변입니다. 이 안내로 주문 변경·취소·환불이 실행되지는 않습니다.';
}
