import {useEffect,useRef,useState} from 'react';
import {onIdTokenChanged,type User} from 'firebase/auth';
import {auth} from './firebase';
import {scenarios,deviceById,restoreChoices,type Choice} from './smart-home-catalog';
import {estimateLabel,estimateTotal} from './scenario-estimates';
type RequestData={requestId:string;expectedTotal:number;items:{scenarioId:string;deviceId:string;quantity:number}[]};
type Receipt={paymentId:string;orderId:string;productName:string;amount:number;createdAt:string;status:string;items:{productId:string;productName:string;unitPrice:number;quantity:number;lineTotal:number}[]};
const API='https://paybridge-mock.vercel.app/api/';
function readPending(raw:string):RequestData{
 const v=JSON.parse(raw),clean=restoreChoices(JSON.stringify(v.items));
 if(!/^[a-f0-9-]{36}$/i.test(v.requestId)||!Array.isArray(v.items)||!clean.length||clean.length!==v.items.length||!Number.isInteger(v.expectedTotal)||v.expectedTotal<=0)throw Error();
 return {requestId:v.requestId,expectedTotal:v.expectedTotal,items:clean.map(({scenarioId,deviceId,quantity})=>({scenarioId,deviceId,quantity}))};
}
export default function ScenarioCheckout({choices,onLockedChange}:{choices:Choice[];onLockedChange:(locked:boolean)=>void}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[consent,setConsent]=useState(false),[pending,setPending]=useState<RequestData|null>(null),[receipt,setReceipt]=useState<Receipt|null>(null),[error,setError]=useState(''),[recoveryBlocked,setRecoveryBlocked]=useState(false);
 const working=useRef(false),uidRef=useRef<string|null>(null),heading=useRef<HTMLHeadingElement>(null);
 const key=JSON.stringify(choices.map(({scenarioId,deviceId,quantity})=>({scenarioId,deviceId,quantity})));
 useEffect(()=>{setConsent(false)},[key]);
 useEffect(()=>{onLockedChange(busy||!!pending);return()=>onLockedChange(false)},[busy,pending,onLockedChange]);
 useEffect(()=>{if(receipt)heading.current?.focus()},[receipt?.paymentId]);
 useEffect(()=>{if(!auth){setReady(true);return;}return onIdTokenChanged(auth,current=>{
 const uid=current?.uid||null;uidRef.current=uid;setUser(current);setReady(false);setReceipt(null);setPending(null);setConsent(false);setError('');setRecoveryBlocked(false);
 void(async()=>{try{if(!current||current.isAnonymous)return;
 const raw=localStorage.getItem('paybridge:scenario-pending:'+current.uid),id=localStorage.getItem('paybridge:scenario-receipt:'+current.uid);
 if(raw){if(uidRef.current===uid)setPending(readPending(raw));return;}
 if(!id)return;
 const r=await fetch(API+'receipt?paymentId='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+await current.getIdToken()},cache:'no-store'});
 if(!r.ok)throw Error();const data:Receipt=await r.json();if(uidRef.current===uid)setReceipt(data);
 }catch{if(uidRef.current===uid){setRecoveryBlocked(true);setError('이전 주문 정보를 확인하지 못했어요. 새로고침 후 다시 확인해 주세요.');}}
 finally{if(uidRef.current===uid)setReady(true)}})();
 });},[]);
 async function purchase(){
 if(recoveryBlocked||working.current||!user||user.isAnonymous||!ready||(!pending&&(!choices.length||!consent)))return;
 const uid=user.uid;working.current=true;setBusy(true);setError('');
 try{
 const request=pending||{requestId:crypto.randomUUID(),expectedTotal:estimateTotal(choices),items:choices.map(({scenarioId,deviceId,quantity})=>({scenarioId,deviceId,quantity}))};
 localStorage.setItem('paybridge:scenario-pending:'+uid,JSON.stringify(request));setPending(request);
 const r=await fetch(API+'scenario-checkout',{method:'POST',headers:{Authorization:'Bearer '+await user.getIdToken(),'Content-Type':'application/json'},body:JSON.stringify(request),cache:'no-store',signal:AbortSignal.timeout(45000)});
 if(uidRef.current!==uid)return;
 const data=await r.json();
 if(!r.ok){if(['PRICE_CHANGED','PRODUCT_UNAVAILABLE','INVALID_INPUT','REQUEST_CONFLICT'].includes(data.error)){
 localStorage.removeItem('paybridge:scenario-pending:'+uid);setPending(null);setConsent(false);
 setError(data.error==='PRODUCT_UNAVAILABLE'?'선택한 기기 중 구매할 수 없는 항목이 있어요. 구성을 변경해 주세요.':data.error==='REQUEST_CONFLICT'?'기존 주문과 요청 구성이 다릅니다. 마이페이지에서 주문을 확인해 주세요.':'구성과 금액을 다시 확인해 주세요. 화면을 새로고침하면 최신 예상가가 표시됩니다.');return;}throw Error();}
 if(data.status!=='MOCK_APPROVED'||!data.paymentId||!Array.isArray(data.items))throw Error();
 setReceipt(data);setPending(null);setConsent(false);
 try{localStorage.setItem('paybridge:scenario-receipt:'+uid,data.paymentId);localStorage.setItem('smartspace-receipt:'+uid,data.paymentId);localStorage.removeItem('paybridge:scenario-pending:'+uid);}catch{setError('주문은 완료됐지만 이 브라우저에 영수증 번호를 보관하지 못했어요. 아래 주문 번호를 확인해 주세요.');}
 }catch{if(uidRef.current===uid)setError('결과를 확인하지 못했어요. ‘같은 주문 결과 다시 확인’을 누르면 기존 요청 번호로 확인합니다.');}
 finally{working.current=false;setBusy(false);}
 }
 function again(){if(!user)return;try{localStorage.removeItem('paybridge:scenario-receipt:'+user.uid)}catch{}setReceipt(null);setConsent(false);setError('');}
 if(!ready)return <p role="status">이전 주문과 로그인 상태를 확인하고 있어요…</p>;
 if(receipt)return <section className="scenario-order-receipt" aria-labelledby="scenario-receipt-title"><p className="scenario-eyebrow">ORDER RECEIPT</p><h2 id="scenario-receipt-title" ref={heading} tabIndex={-1}>선택한 구성의 모의 구매가 완료됐어요.</h2><p>실제 청구 없이 주문이 저장되었습니다.</p><ul>{receipt.items.map((i,index)=><li key={index}><span>{i.productName}<small>{i.unitPrice.toLocaleString('ko-KR')}원 × {i.quantity}개</small></span><strong>{i.lineTotal.toLocaleString('ko-KR')}원</strong></li>)}</ul><div className="scenario-order-total"><span>주문 합계</span><strong>{receipt.amount.toLocaleString('ko-KR')}원</strong></div><dl><dt>주문 번호</dt><dd>{receipt.orderId}</dd><dt>결제 번호</dt><dd>{receipt.paymentId}</dd><dt>기록 시각</dt><dd>{new Date(receipt.createdAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</dd><dt>상태</dt><dd>모의 승인 · 실제 청구 없음</dd></dl><p>판매자·관리자 주문 내역에서도 같은 기기·수량·금액을 확인할 수 있습니다.</p><button onClick={again}>다른 구성 고르기</button>{error&&<p role="alert">{error}</p>}</section>;
 const items=pending?.items||choices,total=pending?.expectedTotal??estimateTotal(choices);
 return <section className="scenario-order-checkout" aria-labelledby="scenario-checkout-title" aria-busy={busy}><h2 id="scenario-checkout-title">선택한 구성으로 구매하기</h2>{items.length?<ul>{items.map(i=><li key={i.scenarioId}><span>{scenarios.find(s=>s.id===i.scenarioId)?.title}<small>{deviceById[i.deviceId]?.name} · {i.quantity}개</small></span><strong>{estimateLabel(i.deviceId,i.quantity)}</strong></li>)}</ul>:<p>공간별 카드에서 필요한 항목을 선택해 주세요.</p>}<div className="scenario-order-total"><span>선택 기기 {items.reduce((n,i)=>n+i.quantity,0)}개 · 예상 합계</span><strong>{total.toLocaleString('ko-KR')}원</strong></div><p className="scenario-small">표시 금액은 데모용 예상가입니다. 서버에서 같은 상품·수량·금액인지 확인한 후 모의 주문으로 저장합니다.</p><label className="scenario-order-consent"><input type="checkbox" checked={consent} disabled={!items.length||busy||!!pending} onChange={e=>setConsent(e.target.checked)}/>선택한 기기·수량·금액을 확인했으며, 실제 청구·배송 없는 모의 구매에 동의합니다.</label><button className="scenario-primary" disabled={recoveryBlocked||busy||!user||user.isAnonymous||(!pending&&(!items.length||!consent))} onClick={()=>void purchase()}>{busy?'주문 결과 확인 중…':pending?'같은 주문 결과 다시 확인':'선택 구성 모의 구매'}</button>{pending&&<p role="status">확인 중인 주문의 기기·수량을 유지하고 있습니다.</p>}{error&&<p role="alert">{error}</p>}</section>;
}
