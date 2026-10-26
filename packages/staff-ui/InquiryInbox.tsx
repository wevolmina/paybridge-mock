"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {getAuth,type User} from 'firebase/auth';
import './inquiries.css';
type Item={id:string;productId:string;subject:string;body:string;category:string;status:string;createdAt:string;updatedAt:string;replies:{body:string;publishedAt:string}[];version?:number;assigneeUid?:string|null;draft?:string;draftSource?:string|null;approved?:boolean};
type Props={user:User;mode:'customer'|'merchant'|'admin';apiOrigin?:string};
const categories:Record<string,string>={order_lookup:'주문·배송 조회',returns:'교환·반품',order_change:'주문 변경·취소',product:'상품·설치',other:'기타·확인 필요',complex:'복합 문의'};
const statuses:Record<string,string>={open:'접수',in_progress:'처리 중',waiting_customer:'답변 공개',resolved:'해결',closed:'종료'};
const products=[['general','공간 체험·일반 문의'],['bedroom-lighting','침실 조명'],['kitchen-sensing','주방 센서'],['desk-focus','서재 집중']];
const errors:Record<string,string>={VERSION_CONFLICT:'다른 담당자가 먼저 수정했습니다. 새로고침 후 다시 검토하세요.',APPROVAL_REQUIRED:'관리자의 답변 승인이 필요합니다.',ADMIN_REQUIRED:'관리자만 사용할 수 있는 기능입니다.',AI_NOT_CONFIGURED:'AI 연결이 아직 설정되지 않았습니다. 기본 안내 초안이나 직접 작성을 이용하세요.',AI_UNAVAILABLE:'AI 초안을 만들지 못했습니다. 직접 작성하거나 나중에 다시 시도하세요.',TRY_LATER:'접수 한도에 도달했거나 다른 요청을 처리 중입니다. 잠시 후 다시 시도하세요.',ACCOUNT_LOGIN_REQUIRED:'간편로그인 후 문의를 이용해 주세요.',STAFF_REQUIRED:'승인된 상점 담당자 권한이 필요합니다.',INQUIRY_UNAVAILABLE:'문의 서비스 준비 상태를 확인하지 못했습니다. 잠시 후 다시 시도하세요.',STORE_SELECTION_REQUIRED:'일반 문의를 보낼 상점을 확인해야 합니다. 관련 패키지를 선택해 다시 접수하세요.',REQUEST_CONFLICT:'이 접수 번호로 다른 문의가 저장돼 있습니다. 기존 문의를 확인하세요.'};
const date=(s:string)=>new Date(s.includes('T')?s:s.replace(' ','T')+'Z').toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
export default function InquiryInbox({user,mode,apiOrigin=''}:Props){
 const staff=mode!=='customer',admin=mode==='admin';
 const base=apiOrigin.replace(/\/$/,'')+(staff?'/api/'+(admin?'admin':'staff')+'/inquiries':'/api/inquiries');
 const [items,setItems]=useState<Item[]>([]),[selectedId,setSelectedId]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[next,setNext]=useState<string|null>(null),[assignees,setAssignees]=useState<string[]>([]);
 const [subject,setSubject]=useState(''),[body,setBody]=useState(''),[productId,setProductId]=useState(products[0][0]),[draft,setDraft]=useState(''),[checked,setChecked]=useState(false),[filter,setFilter]=useState('all');
 const [manageStatus,setManageStatus]=useState('open'),[manageCategory,setManageCategory]=useState('other'),[assignee,setAssignee]=useState('');
 const alive=useRef(true),lock=useRef(false),loadSeq=useRef(0),pending=useRef<{requestId:string;productId:string;subject:string;body:string}|null>(null);
 const selected=items.find(i=>i.id===selectedId);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;loadSeq.current++}},[]);
 const isCurrent=()=>alive.current&&getAuth().currentUser?.uid===user.uid;
 async function request(method:string,payload?:unknown,cursor?:string){
  const r=await fetch(base+(cursor?'?before='+encodeURIComponent(cursor):''),{method,credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+await user.getIdToken(),...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(30000)});
  const data=await r.json().catch(()=>({}));if(!r.ok){const e=Object.assign(Error(errors[data.error]||'연결 또는 권한을 확인하지 못했습니다. 다시 시도해 주세요.'),{status:r.status});throw e;}return data;
 }
 const load=useCallback(async(cursor?:string)=>{
  const seq=++loadSeq.current;setLoading(true);
  try{const result=await request('GET',undefined,cursor);if(!isCurrent()||seq!==loadSeq.current)return;setItems(old=>cursor?[...old.filter(x=>!result.inquiries.some((r:Item)=>r.id===x.id)),...result.inquiries]:result.inquiries);setNext(result.nextCursor);setAssignees(result.assignees||[]);setError('');}
  catch(e){if(isCurrent()&&seq===loadSeq.current)setError(e instanceof Error?e.message:'문의 조회 실패');}
  finally{if(isCurrent()&&seq===loadSeq.current)setLoading(false);}
 },[base,user]);
 useEffect(()=>{void load()},[load]);
 // Never replace an unsaved draft via background polling. Selection/version changes reset review.
 useEffect(()=>{setDraft(selected?.draft||'');setChecked(false);setManageStatus(selected?.status||'open');setManageCategory(selected?.category||'other');setAssignee(selected?.assigneeUid||'');},[selectedId,selected?.version]);
 async function submit(event:React.FormEvent){event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
  const payload=pending.current||{requestId:crypto.randomUUID(),productId,subject:subject.trim(),body:body.trim()};pending.current=payload;
  try{await request('POST',payload);if(!isCurrent())return;pending.current=null;setSubject('');setBody('');setNotice('문의가 접수되었습니다. 아래 내 문의에서 답변을 확인할 수 있습니다.');await load();}
  catch(e){const status=(e as {status?:number})?.status;if(status&&status<500)pending.current=null;if(isCurrent())setError((e instanceof Error?e.message:'접수 실패')+(pending.current?' 같은 내용으로 다시 접수하면 중복을 방지합니다.':''));}
  finally{lock.current=false;if(isCurrent())setBusy(false);}
 }
 async function act(action:string,extra:Record<string,unknown>={}){if(!selected||lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');
  try{await request('POST',{id:selected.id,version:selected.version,action,...extra});if(!isCurrent())return;setNotice(action==='publish'?'승인된 답변을 구매자 문의 내역에 공개했습니다.':action==='approve'?'저장된 답변을 승인했습니다. 공개 버튼을 누르기 전까지 구매자에게 보이지 않습니다.':'변경을 저장했습니다. 답변 검토·승인이 필요한지 확인하세요.');await load();}
  catch(e){if(isCurrent())setError(e instanceof Error?e.message:'변경 실패');}
  finally{lock.current=false;if(isCurrent())setBusy(false);}
 }
 const visible=items.filter(i=>filter==='all'||i.status===filter),unsaved=selected&&draft!==(selected.draft||''),managementChanged=selected&&(manageStatus!==selected.status||manageCategory!==selected.category||assignee!==(selected.assigneeUid||''));
 useEffect(()=>{const timer=setInterval(()=>{if(!lock.current&&!loading&&!unsaved&&!managementChanged&&!next&&items.length<=30&&document.visibilityState==='visible')void load();},15000);return()=>clearInterval(timer)},[load,loading,unsaved,managementChanged,next,items.length]);
 return <section className="inquiry-workspace" aria-label={staff?'고객 문의 관리':'문의하기와 내 문의'}>
  <div className="inquiry-heading"><div><span className="inquiry-eyebrow">CUSTOMER CARE</span><h2>{staff?'고객 문의':'문의하기 · 내 문의'}</h2><p>{staff?'초안은 내부에서 검토하고, 관리자 승인 후 구매자에게 공개합니다. 편집 중이 아닐 때 최근 목록을 15초마다 확인합니다.':'내가 남긴 문의와 공개된 답변을 확인하세요.'}</p></div><button type="button" disabled={busy||loading} onClick={()=>{if(unsaved&&!window.confirm('저장하지 않은 초안을 두고 새로고침할까요?'))return;void load()}}>새로고침</button></div>
  <p className="inquiry-note">모의 주문 환경입니다. 문의 답변은 실제 주문 변경·취소·환불을 실행하지 않습니다.</p>
  {error&&<p className="inquiry-error" role="alert">{error}</p>}{notice&&<p className="inquiry-note" role="status">{notice}</p>}
  {!staff&&<form className="inquiry-card" onSubmit={submit}><h3>새 문의</h3><p>전화번호·주소·비밀번호·결제정보를 입력하지 마세요. 문의는 해당 상점 담당자에게 전달됩니다.</p><label>관련 패키지<select value={productId} disabled={busy||!!pending.current} onChange={e=>setProductId(e.target.value)}>{products.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>제목<input minLength={2} maxLength={120} required disabled={busy||!!pending.current} value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>문의 내용<textarea minLength={5} maxLength={3000} required disabled={busy||!!pending.current} value={body} onChange={e=>setBody(e.target.value)}/></label><button type="submit" disabled={busy||loading}>{busy?'접수 확인 중…':pending.current?'같은 문의 접수 다시 확인':'문의 접수'}</button>{pending.current&&<p>결과가 불확실한 동안 입력을 유지합니다. 새로고침하거나 계정을 바꾸기 전에 내 문의에서 접수 여부를 확인하세요.</p>}</form>}
  <div className="inquiry-layout"><div className="inquiry-card"><label>처리 상태<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">전체</option>{Object.entries(statuses).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><p>{loading?'문의 확인 중…':`현재 불러온 문의 ${items.length}건`}</p><div className="inquiry-list">{visible.map(i=><button key={i.id} type="button" aria-pressed={selectedId===i.id} disabled={busy} onClick={()=>{if(unsaved&&!window.confirm('저장하지 않은 초안을 두고 다른 문의를 열까요?'))return;setSelectedId(i.id);setNotice('');}}><span>{statuses[i.status]} · {categories[i.category]}</span><strong>{i.subject}</strong><small>{date(i.createdAt)}</small></button>)}</div>{!loading&&!visible.length&&<p>표시할 문의가 없습니다.</p>}{next&&<button disabled={loading||busy} onClick={()=>void load(next)}>이전 문의 더 보기</button>}</div>
  <div className="inquiry-card">{!selected?<p>문의 제목을 선택하면 내용을 볼 수 있습니다.</p>:<><div className="inquiry-detail-heading"><span>{statuses[selected.status]} · {categories[selected.category]}</span><h3>{selected.subject}</h3><small>{date(selected.createdAt)} · {products.find(x=>x[0]===selected.productId)?.[1]||selected.productId}</small></div><p className="inquiry-message">{selected.body}</p>
   <h3>공개된 답변</h3>{selected.replies.length?selected.replies.map((r,i)=><article className="inquiry-reply" key={i}><small>{date(r.publishedAt)}</small><p className="inquiry-message">{r.body}</p></article>):<p>아직 공개된 답변이 없습니다.</p>}
   {staff&&<><p>담당: {selected.assigneeUid?selected.assigneeUid===user.uid?'나':admin&&assignees.includes(selected.assigneeUid)?`판매자 ${assignees.indexOf(selected.assigneeUid)+1}`:'판매자 배정됨':'미배정'} · 분류는 키워드 기반 추천입니다.</p>
   {admin&&<fieldset disabled={busy}><legend>문의 관리</legend><label>처리 상태<select value={manageStatus} onChange={e=>setManageStatus(e.target.value)}>{Object.entries(statuses).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>분류<select value={manageCategory} onChange={e=>setManageCategory(e.target.value)}>{Object.entries(categories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>담당 판매자<select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">미배정</option>{assignees.map((uid,i)=><option key={uid} value={uid}>판매자 {i+1}{uid===user.uid?' (나)':''}</option>)}{selected.assigneeUid&&!assignees.includes(selected.assigneeUid)&&<option value={selected.assigneeUid}>기존 담당자 (권한 재확인 필요)</option>}</select></label><p>관리를 저장하면 기존 초안·승인이 해제됩니다.</p><button disabled={!managementChanged} onClick={()=>{if((selected.draft||unsaved)&&!window.confirm('문의 관리를 변경하면 기존 초안과 승인이 해제됩니다. 계속할까요?'))return;void act('manage',{status:manageStatus,category:manageCategory,assigneeUid:assignee||null})}}>문의 관리 저장</button></fieldset>}
   <h3>직원 답변 초안</h3><p>{selected.draftSource==='ai'?'AI 작성 초안':selected.draftSource==='template'?'기본 안내 문장 초안':'직원 작성'} · {selected.approved&&!unsaved?'관리자 승인됨':'검토·승인 필요'} · 구매자 미공개</p><div className="inquiry-actions"><button disabled={busy||selected.status==='closed'} onClick={()=>{if(unsaved&&!window.confirm('수정 중인 초안을 새 초안으로 바꿀까요?'))return;void act('suggest',{engine:'template'})}}>기본 안내 초안</button><button disabled={busy||selected.status==='closed'} onClick={()=>{if(unsaved&&!window.confirm('수정 중인 초안을 AI 초안으로 바꿀까요?'))return;void act('suggest',{engine:'ai'})}}>AI 초안 만들기</button></div><p>AI는 연결 설정이 있을 때만 작동합니다. 문의 원문·이름·주문번호 대신 분류와 일반 안내 문장만 전송합니다. 별도 정책이 확인되지 않은 내용은 확답하지 마세요.</p><label>답변 내용<textarea value={draft} maxLength={4000} disabled={busy||selected.status==='closed'} onChange={e=>{setDraft(e.target.value);setChecked(false)}}/></label><div className="inquiry-actions"><button disabled={busy||!unsaved||draft.trim().length<5||selected.status==='closed'} onClick={()=>void act('draft',{body:draft.trim()})}>초안 저장 · 승인 해제</button></div>
   {admin&&<label className="inquiry-check"><input type="checkbox" checked={checked} disabled={busy||!!unsaved||!!managementChanged} onChange={e=>setChecked(e.target.checked)}/>저장된 답변과 정책·사실을 검토했습니다.</label>}
   <div className="inquiry-actions">{admin&&<button disabled={busy||!!unsaved||!!managementChanged||!checked||!selected.draft||selected.approved||selected.status==='closed'} onClick={()=>void act('approve')}>저장된 답변 승인</button>}<button disabled={busy||!!unsaved||!!managementChanged||!selected.approved||selected.status==='closed'} onClick={()=>void act('publish')}>승인된 답변 구매자에게 공개</button></div><small>초안·문의 관리 변경 시 서버에서도 승인이 해제됩니다. 공개는 문의 내역 표시이며 카카오·이메일 발송이 아닙니다.</small></>}
  </>}</div></div>
 </section>;
}
