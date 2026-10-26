import React from 'react';
import {createRoot} from 'react-dom/client';
import ScenarioExperience from './ScenarioExperience';
createRoot(document.getElementById('root')!).render(<React.StrictMode><ScenarioExperience initialRoom="bedroom"/></React.StrictMode>);
