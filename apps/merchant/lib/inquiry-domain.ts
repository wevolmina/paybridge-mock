import {z} from 'zod';
export const categories=['order_lookup','returns','order_change','product','other','complex'] as const;
export const statuses=['open','in_progress','waiting_customer','resolved','closed'] as const;
export type Category=typeof categories[number];
export class InquiryError extends Error {constructor(public code:string,public status=400){super(code)}}
export const createInquiryInput=z.object({requestId:z.string().uuid(),productId:z.string().min(1).max(40),subject:z.string().trim().min(2).max(120),body:z.string().trim().min(5).max(3000)}).strict();
const base={id:z.string().uuid(),version:z.number().int().min(1).max(2147483646)};
export const inquiryActionInput=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('manage'),status:z.enum(statuses),category:z.enum(categories),assigneeUid:z.string().min(1).max(128).nullable()}).strict(),
 z.object({...base,action:z.literal('draft'),body:z.string().trim().min(5).max(4000)}).strict(),
 z.object({...base,action:z.literal('suggest'),engine:z.enum(['template','ai'])}).strict(),
 z.object({...base,action:z.literal('approve')}).strict(),
 z.object({...base,action:z.literal('publish')}).strict(),
]);
export function classifyInquiry(text:string):Category {
 const s=text.replace(/\s/g,'');const matches:Category[]=[];
 if(/교환|반품|환불/.test(s))matches.push('returns');
 if(/변경|취소|바꾸|바꿔|수정/.test(s))matches.push('order_change');
 if(/주문조회|주문내역|주문번호|배송조회|배송언제|배송이|배송상태|주문확인/.test(s)||(/비회원/.test(s)&&/조회|내역/.test(s)))matches.push('order_lookup');
 if(!matches.length&&/호환|설치|연동|상품|센서|조명/.test(s))return 'product';
 return matches.length>1?'complex':matches[0]||'other';
}
export const categoryLabels:Record<Category,string>={order_lookup:'주문·배송 조회',returns:'교환·반품',order_change:'주문 변경·취소',product:'상품·설치',other:'기타·확인 필요',complex:'복합 문의'};
export function templateDraft(category:Category){
 const intro='안녕하세요. 페이브릿지 문의 담당자입니다.\n\n';
 const texts:Record<Category,string>={order_lookup:'구매하신 계정과 주문 내역을 확인한 뒤 안내드리겠습니다. 현재 이 답변만으로 배송 상태를 확정할 수는 없습니다.',returns:'교환·반품을 원하시는 사유와 상품 상태를 확인한 뒤 적용 가능한 절차를 안내드리겠습니다. 적용 정책과 비용은 담당자의 확인이 필요합니다.',order_change:'요청하신 변경·취소 내용과 실제 주문 진행 상태를 확인한 뒤 가능 여부를 안내드리겠습니다. 현재 변경·취소가 완료된 것은 아닙니다.',product:'설치 환경과 사용 중인 기기 정보를 확인한 뒤 호환·설치 가능 여부를 안내드리겠습니다. 실제 기기 연동을 보장하는 안내는 아닙니다.',other:'문의 내용을 담당자가 확인한 뒤 안내드리겠습니다. 추가로 필요한 정보가 있으면 이 문의 내역을 통해 안내드리겠습니다.',complex:'문의에 포함된 여러 요청을 담당자가 나누어 확인하겠습니다. 각 요청의 가능 여부와 절차는 확인 후 안내드리겠습니다.'};
 return intro+texts[category]+'\n\n페이브릿지는 현재 모의 주문 환경입니다. 실제 결제·배송·환불 처리는 실행되지 않습니다.';
}
// Approval is bound to the entire locked row version. Management/draft edits clear it.
export function assertCanPublish(row:{draft:unknown;approved_by:unknown;approved_at:unknown}) {
 if(typeof row.draft!=='string'||!row.draft.trim()||!row.approved_by||!row.approved_at)throw new InquiryError('APPROVAL_REQUIRED',409);
}
