import '@bridge/staff-ui/inquiries.css';
import {lazy,Suspense} from 'react';
import ScenarioExperience from './ScenarioExperience';
const CustomerSupport=lazy(()=>import('./CustomerSupport'));
const LegacyStore=lazy(()=>import('./CartStore'));
export default function SmartspaceApp(){
 const q=new URLSearchParams(location.search);
 if(q.has('support'))return <Suspense fallback={<p role="status">문의 화면을 준비하고 있어요…</p>}><CustomerSupport/></Suspense>;
 // Existing package purchase and receipt deep links keep their original server contract.
 return <>{q.has('legacy')||q.has('package')?<Suspense fallback={<p role="status">주문 화면을 준비하고 있어요…</p>}><LegacyStore/></Suspense>:<ScenarioExperience/>}<a className="customer-support-link" href="/?support">문의하기 · 내 문의</a></>;
}
