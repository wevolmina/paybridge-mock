import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {onIdTokenChanged,signOut,type User} from 'firebase/auth';
import SocialLogin from '@bridge/staff-ui/SocialLogin';
import '@bridge/staff-ui/social-login.css';
import {auth} from './firebase';
import {restoreChoices,scenarios,deviceById} from './smart-home-catalog';
import './customer-gateway.css';

const API='https://paybridge-mock.vercel.app';
const AccountContext=createContext<()=>void>(()=>{});
const LogoutContext=createContext<{logout:()=>void;busy:boolean}>({logout:()=>{},busy:false});
export function useCustomerLogout(){return useContext(LogoutContext)}
export function useCustomerAccount(){return useContext(AccountContext)}
type Receipt={orderId:string;productName:string;amount:number;status:string;createdAt:string};
function OrderSummary({user}:{user:User}){
 const [result,setResult]=useState<{loading:boolean;receipt?:Receipt;error?:string;pending?:boolean}>({loading:true});
 useEffect(()=>{let current=true;const controller=new AbortController();
  void(async()=>{try{
   const id=localStorage.getItem('smartspace-receipt:'+user.uid),pending=!!(localStorage.getItem('paybridge:scenario-pending:'+user.uid)||localStorage.getItem('smartspace-pending:'+user.uid));
   if(!id){if(current)setResult({loading:false,pending});return;}
   const response=await fetch(API+'/api/receipt?paymentId='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+await user.getIdToken()},cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error();
   const receipt:Receipt=await response.json();if(current)setResult({loading:false,receipt,pending});
  }catch{if(current)setResult({loading:false,error:'주문 기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'});}})();
  return()=>{current=false;controller.abort()};
 },[user.uid]);
 if(result.loading)return <p role="status">주문 기록을 확인하고 있어요.</p>;
 return <section className="account-section"><h3>주문 내역</h3><p>이 브라우저에 보관된 최근 모의 주문을 확인합니다.</p>{result.error?<p role="alert">{result.error}</p>:result.receipt?<div className="account-receipt"><strong>{result.receipt.productName}</strong><p>{result.receipt.amount.toLocaleString('ko-KR')}원</p><dl><dt>주문 번호</dt><dd>{result.receipt.orderId}</dd><dt>주문 상태</dt><dd>{result.receipt.status==='MOCK_APPROVED'?'모의 승인 · 실제 청구 없음':result.receipt.status}</dd></dl></div>:<p className="account-empty">이 브라우저에 저장된 주문 내역이 없어요.</p>}{result.pending&&<a href="/#purchase">진행 중인 주문 결과 확인하기</a>}</section>;
}
function SavedConfiguration(){
 const [choices]=useState(()=>{try{return restoreChoices(localStorage.getItem('paybridge:scenario-draft:v1'))}catch{return []}});
 return <section className="account-section"><h3>저장한 구성</h3><p>이 브라우저에 저장한 체험 초안입니다.</p>{choices.length?<ul className="account-choices">{choices.map(c=><li key={c.scenarioId}><strong>{scenarios.find(s=>s.id===c.scenarioId)?.title}</strong><span>{deviceById[c.deviceId]?.name} · {c.quantity}개</span><a href={'/?scenario='+encodeURIComponent(c.scenarioId)+'#experience'}>이 장면 이어보기</a></li>)}</ul>:<p className="account-empty">체험 화면에서 마음에 드는 기기를 내 구성에 담아보세요.</p>}</section>;
}
function Landing({onLogin}:{onLogin:()=>void}){
 return <div className="gateway-landing"><header className="gateway-header"><a className="gateway-logo" href="/">paybridge <small>SMART LIVING</small></a><nav aria-label="사이트 메뉴"><a href="#service">서비스 소개</a><button onClick={onLogin}>로그인</button></nav></header><main><section className="gateway-hero"><div className="gateway-copy"><p className="gateway-eyebrow">스마트홈을 제안하는 새로운 방법</p><h1>설명만으로 어려운 스마트홈,<br/><em>공간으로 보여주세요.</em></h1><p className="gateway-description">판매자의 제품 설명을 고객의 생활 장면으로.<br/>침실부터 주방까지, 기기가 만드는 변화를 3D로 체험하고<br className="desktop-break"/> 필요한 구성과 문의로 이어가세요.</p><button className="gateway-primary" onClick={onLogin}>로그인하고 3D 체험 시작</button><p className="gateway-caption">구글 · 카카오 계정으로 시작할 수 있어요.</p></div><div className="gateway-visual" role="img" aria-label="침대와 조명, 커튼을 배치한 스마트홈 공간 미리보기"><div className="gateway-visual-label">A SMALL CHANGE IN YOUR SPACE</div><div className="room-preview"><div className="room-window"/><div className="room-headboard"/><div className="room-bed"><span/></div><div className="room-table"/><div className="room-lamp"/><span className="room-light"/></div><div className="gateway-visual-footer"><span>침실 · 편안한 밤과 아침</span><strong>01 / 04</strong></div></div></section><section id="service" className="gateway-service"><div className="gateway-section-title"><p className="gateway-eyebrow">제품을 넘어 생활을 제안하세요</p><h2>고객이 이해하는 순간,<br/>다음 선택이 쉬워집니다.</h2><p>로그인 후 네 공간의 열여섯 가지 생활 장면을 둘러보세요.</p></div><div className="gateway-features"><article><span>01 / EXPERIENCE</span><h3>변화를 직접 체험</h3><p>조명, 커튼, 센서가 일상에서 어떻게 작동하는지 공간 안에서 확인합니다.</p></article><article><span>02 / CONFIGURE</span><h3>필요한 기기 구성</h3><p>생활 장면에 맞는 기기를 고르고 설치 조건과 예상 금액을 확인합니다.</p></article><article><span>03 / CONNECT</span><h3>문의와 답변으로 연결</h3><p>구매자는 궁금한 점을 남기고, 판매자와 관리자는 담당 화면에서 응대합니다.</p></article></div><div className="gateway-spaces"><span>침실 / 편안한 밤과 아침</span><span>주방 / 물과 전력 감지</span><span>데스크 / 집중과 휴식</span><span>화장실 / 점등과 환기</span></div></section><section className="gateway-bottom"><h2>우리 제품이 만드는 일상,<br/>먼저 체험해 보세요.</h2><button className="gateway-primary" onClick={onLogin}>간편로그인으로 시작하기</button><p>공간 체험과 모의 구매를 위한 데모입니다.<br/>실제 결제·배송·기기 연결은 진행되지 않습니다.</p></section></main><footer className="gateway-footer">PAYBRIDGE · 공간의 경험을 선택으로 연결합니다.</footer></div>;
}
export default function CustomerGateway({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [panel,setPanel]=useState<'login'|'account'|null>(null),[tab,setTab]=useState<'saved'|'orders'>('saved');
 const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null),wasMember=useRef(false);
 const member=!!user&&!user.isAnonymous;
 useEffect(()=>{if(!auth){setReady(true);return;}return onIdTokenChanged(auth,u=>{setUser(u);setReady(true)},()=>{setError('로그인 상태를 확인하지 못했어요. 새로고침해 주세요.');setReady(true)});},[]);
 useEffect(()=>{if(member&&!wasMember.current)setPanel(null);wasMember.current=member},[member]);
 useEffect(()=>{const d=dialog.current;if(!d)return;if(panel){previousFocus.current=document.activeElement as HTMLElement;d.showModal()}else if(d.open){d.close();previousFocus.current?.focus()}},[panel]);
 async function logout(){if(!auth||busy)return;setBusy(true);setError('');try{await signOut(auth);setPanel(null)}catch{setError('로그아웃하지 못했어요. 다시 시도해 주세요.')}finally{setBusy(false)}}
 function openAccount(){setTab('saved');setPanel(member?'account':'login')}
 return <AccountContext.Provider value={openAccount}><LogoutContext.Provider value={{logout:()=>void logout(),busy}}>{!ready?<main className="gateway-loading" role="status">로그인 상태를 확인하고 있어요…</main>:member?children:<Landing onLogin={()=>setPanel('login')}/>}<dialog ref={dialog} className="gateway-dialog" aria-labelledby="gateway-dialog-title" onCancel={e=>{if(busy)e.preventDefault();else setPanel(null)}} onClick={e=>{if(e.target===e.currentTarget&&!busy)setPanel(null)}}><div className="gateway-dialog-content"><div className="gateway-dialog-top"><span>PAYBRIDGE</span><button aria-label="창 닫기" disabled={busy} onClick={()=>setPanel(null)}>닫기</button></div>{panel==='account'&&user?<><h2 id="gateway-dialog-title">마이페이지</h2><p>{user.displayName||'회원'}님, 반갑습니다.</p><div className="account-tabs" aria-label="마이페이지 메뉴"><button aria-pressed={tab==='saved'} onClick={()=>setTab('saved')}>저장한 구성</button><button aria-pressed={tab==='orders'} onClick={()=>setTab('orders')}>주문 내역</button><a href="/?support">내 문의</a></div>{tab==='saved'?<SavedConfiguration/>:<OrderSummary key={user.uid} user={user}/>}<button className="gateway-signout" disabled={busy} onClick={()=>void logout()}>{busy?'로그아웃 중…':'로그아웃'}</button></>:<><p className="gateway-eyebrow">나의 공간 경험 시작하기</p><h2 id="gateway-dialog-title">로그인하고<br/>공간을 만나보세요.</h2><p>로그인 후 3D 체험과 구성 선택, 문의를 이용할 수 있어요.</p><SocialLogin auth={auth} apiOrigin={API} blockCustomForGuest={!!user?.isAnonymous} onBusyChange={setBusy}/>{!auth&&<p role="alert">로그인 연결을 준비하고 있어요. 잠시 후 다시 접속해 주세요.</p>}</>}{error&&<p role="alert">{error}</p>}</div></dialog>{error&&!panel&&<p className="gateway-global-error" role="alert">{error}</p>}</LogoutContext.Provider></AccountContext.Provider>;
}
