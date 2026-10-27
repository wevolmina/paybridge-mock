import {useEffect,useState} from 'react';
import {onIdTokenChanged,signOut,type User} from 'firebase/auth';
import SocialLogin from '@bridge/staff-ui/SocialLogin';
import InquiryInbox from '@bridge/staff-ui/InquiryInbox';
import '@bridge/staff-ui/social-login.css';
import '@bridge/staff-ui/inquiries.css';
import {auth} from './firebase';
const apiOrigin='https://paybridge-mock.vercel.app';
export default function CustomerSupport(){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!auth){setReady(true);return;}return onIdTokenChanged(auth,u=>{setUser(u);setReady(true);});},[]);
 return <main className="customer-support-page"><nav className="customer-support-top" aria-label="문의 화면 이동"><a href="/">스토어로 돌아가기</a><span>PAYBRIDGE / CUSTOMER CARE</span>{user&&!user.isAnonymous&&<button disabled={busy} onClick={()=>void signOut(auth!).catch(()=>setError('로그아웃하지 못했습니다. 다시 시도하세요.'))}>로그아웃</button>}</nav>{error&&<p role="alert">{error}</p>}{!ready?<p role="status">로그인을 확인하고 있습니다.</p>:user&&!user.isAnonymous?<InquiryInbox key={user.uid} user={user} mode="customer" apiOrigin={apiOrigin}/>:<section className="customer-support-login"><h1>문의하기 · 내 문의</h1><p>내 문의와 답변을 안전하게 다시 확인할 수 있도록 간편로그인 후 이용해 주세요.</p><SocialLogin auth={auth} apiOrigin={apiOrigin} onBusyChange={setBusy}/></section>}</main>;
}
