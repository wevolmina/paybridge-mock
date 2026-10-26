import {test} from 'node:test';
import assert from 'node:assert/strict';
import {devices,scenarios,rooms,sceneState,quote,restoreChoices,type Choice} from '../apps/customer/src/smart-home-catalog.ts';
test('all 16 moments are reachable with valid device options',()=>{
 assert.equal(new Set(scenarios.map(s=>s.id)).size,16);
 for(const room of rooms)assert.equal(scenarios.filter(s=>s.room===room.id).length,4);
 for(const s of scenarios){assert.ok(s.options.length);for(const id of s.options)assert.ok(devices.find(d=>d.id===id));}
});
test('official quote keeps currencies separate and counts missing prices',()=>{
 const choices:Choice[]=[{scenarioId:'sleep',deviceId:'aqara-button',quantity:2,checked:false},{scenarioId:'hidden-button',deviceId:'sonoff-button',quantity:3,checked:false},{scenarioId:'mattress',deviceId:'mattress-diy',quantity:1,checked:false}];
 assert.deepEqual(quote(choices),{KRW:46200,USD:5070,unknown:1});
 assert.deepEqual(quote([{scenarioId:'curtain',deviceId:'curtain-robot',quantity:2,checked:false}]),{KRW:0,USD:0,unknown:2});
 assert.throws(()=>quote([{scenarioId:'sleep',deviceId:'fp2',quantity:1,checked:false}]));
});
test('restoring a draft rejects incompatible models and requires installation recheck',()=>{
 assert.deepEqual(restoreChoices('{invalid'),[]);
 assert.deepEqual(restoreChoices(JSON.stringify([{scenarioId:'sleep',deviceId:'aqara-button',quantity:1,checked:true,price:1},{scenarioId:'sleep',deviceId:'aqara-button',quantity:2},{scenarioId:'leak',deviceId:'fp2',quantity:1},{scenarioId:'curtain',deviceId:'curtain-robot',quantity:-1}])),[{scenarioId:'sleep',deviceId:'aqara-button',quantity:1,checked:false}]);
});
test('scene choices distinguish one-zone Zigbee and multi-zone Wi-Fi sensors',()=>{
 const s=scenarios.find(s=>s.id==='zones')!;assert.equal(sceneState(s,'sonoff-presence').zones,1);assert.equal(sceneState(s,'fp2').zones,3);
 assert.equal(sceneState(s,'fp2',false).presence,false);
 const foot=sceneState(scenarios.find(s=>s.id==='footlight')!,'p1');assert.equal(foot.brightness,15);assert.equal(foot.curtain,0);
 const morning=sceneState(scenarios.find(s=>s.id==='curtain')!,'curtain-robot');assert.equal(morning.curtain,100);
});
test('every numeric price has official provenance and integer minor units',()=>{
 const official=new Set(['www.ikea.com','aqaralife.shop','us.aqara.com','sonoff.tech']);
 for(const d of devices){if(!d.price)continue;assert.equal(Number.isSafeInteger(d.price.amount),true);assert.ok(d.price.amount>0);assert.equal(d.price.checkedAt,'2026-10-26');assert.ok(official.has(new URL(d.price.sourceUrl).hostname));}
});
