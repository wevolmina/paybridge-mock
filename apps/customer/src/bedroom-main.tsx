import React,{lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import CustomerGateway from './CustomerGateway';
const ScenarioExperience=lazy(()=>import('./ScenarioExperience'));
createRoot(document.getElementById('root')!).render(<React.StrictMode><CustomerGateway><Suspense fallback={<p role="status">공간을 준비하고 있어요…</p>}><ScenarioExperience initialRoom="bedroom"/></Suspense></CustomerGateway></React.StrictMode>);
