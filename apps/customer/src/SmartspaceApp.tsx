import {lazy,Suspense} from 'react';
import ScenarioExperience from './ScenarioExperience';
const LegacyStore=lazy(()=>import('./CartStore'));
export default function SmartspaceApp(){
 const q=new URLSearchParams(location.search);
 // Existing package purchase and receipt deep links keep their original server contract.
 return q.has('legacy')||q.has('package')?<Suspense fallback={<p role="status">주문 화면을 준비하고 있어요…</p>}><LegacyStore/></Suspense>:<ScenarioExperience/>;
}
