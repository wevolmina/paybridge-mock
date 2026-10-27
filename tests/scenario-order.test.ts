import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarioInput,scenarioLines,scenarioHash,buildScenario,confirmScenario} from '../apps/merchant/lib/scenario-order';
import {scenarios} from '../apps/customer/src/smart-home-catalog';
import {estimates} from '../packages/scenario-prices';
import type {Pool} from 'mysql2/promise';
const base={requestId:'b59991fc-cfcf-4f9f-bdf9-4cc42224a935',items:scenarios.map(s=>({scenarioId:s.id,deviceId:s.options[0],quantity:2})),expectedTotal:scenarios.reduce((n,s)=>n+estimates[s.options[0]]*2,0)};
test('all four rooms and sixteen selected scenarios retain exact names quantities and server totals',()=>{
 const r=buildScenario('owner',scenarioInput.parse(base));assert.equal(r.items.length,16);assert.equal(new Set(scenarioLines(base).map(i=>i.room)).size,4);assert.equal(r.items.reduce((n,i)=>n+i.quantity,0),32);assert.equal(r.amount,base.expectedTotal);assert.equal(r.items.reduce((n,i)=>n+i.lineTotal,0),r.amount);assert.equal(r.quantity,1);
 for(const i of r.items){assert.ok(i.productId.length<=40);assert.ok(i.productName.length<=200);assert.equal(i.lineTotal,i.unitPrice*i.quantity);}
});
test('reject arbitrary products, incompatible devices, injected prices, duplicate lines and invalid quantities',()=>{
 const first=base.items[0];for(const items of [[],[first,first],[{...first,deviceId:'unknown'}],[{...first,scenarioId:'unknown'}],[{...first,quantity:0}],[{...first,quantity:11}],[{...first,unitPrice:1}],[{...first,deviceId:scenarios.find(s=>!s.options.includes(first.deviceId))!.options[0]}]])assert.equal(scenarioInput.safeParse({...base,items}).success,false);
 assert.equal(scenarioInput.safeParse({...base,amount:1}).success,false);
 assert.throws(()=>buildScenario('owner',{...base,expectedTotal:1}),/PRICE_CHANGED/);
});
test('request retries preserve identity independent of display order; changed quantity or owner is distinct',()=>{
 assert.equal(scenarioHash(base),scenarioHash({...base,items:[...base.items].reverse()}));
 assert.equal(buildScenario('a',base).paymentId,buildScenario('a',{...base,items:[...base.items].reverse()}).paymentId);
 assert.notEqual(buildScenario('a',base).paymentId,buildScenario('b',base).paymentId);
 assert.notEqual(scenarioHash(base),scenarioHash({...base,items:base.items.map((i,n)=>n?i:{...i,quantity:1})}));
});
function fake(failAt=''){
 const statements:{sql:string;args:any[]}[]=[];let hash='';let old=false;
 const c={beginTransaction:async()=>{},commit:async()=>{old=true},rollback:async()=>{old=false},release:()=>{},execute:async(sql:string,args:any[])=>{
 statements.push({sql,args});if(sql.startsWith(failAt)&&failAt)throw Error('INJECTED');
 if(sql.startsWith('INSERT INTO orders'))hash=args[3];
 if(sql.startsWith('SELECT request_hash'))return [[{request_hash:hash}]];
 if(sql.startsWith('SELECT * FROM payments'))return [[]];
 if(sql.startsWith('SELECT name,')){const line=scenarioLines(base).find(i=>i.productId===args[0])!;return [[{name:line.productName,unit_price:line.unitPrice,merchant_id:'studio-mina',active:true}]];}
 return [[],[]];
 }};
 return {pool:{getConnection:async()=>c} as unknown as Pool,statements,committed:()=>old};
}
test('one transaction provisions validated products before FK order lines and saves exact receipt lines',async()=>{
 const db=fake();const r=await confirmScenario(db.pool,'owner',base);assert.equal(db.committed(),true);assert.equal(db.statements.filter(s=>s.sql.startsWith('INSERT INTO order_items')).length,16);
 const lines=db.statements.filter(s=>s.sql.startsWith('INSERT INTO order_items'));assert.deepEqual(lines.map(s=>s.args[5]),base.items.map(()=>2));
 assert.equal(db.statements.find(s=>s.sql.startsWith('INSERT INTO payments'))?.args[7],r.amount);
 assert.ok(db.statements.findIndex(s=>s.sql.startsWith('INSERT IGNORE INTO packages'))<db.statements.findIndex(s=>s.sql.startsWith('INSERT INTO order_items')));
});
test('a failed payment insertion rolls back the configured order',async()=>{
 const db=fake('INSERT INTO payments');await assert.rejects(confirmScenario(db.pool,'owner',base),/INJECTED/);assert.equal(db.committed(),false);
});
test('each alternative device has a stable server price and a distinct order line',()=>{
 for(const s of scenarios)for(const id of s.options){const request={...base,items:[{scenarioId:s.id,deviceId:id,quantity:10}],expectedTotal:estimates[id]*10};const r=buildScenario('owner',scenarioInput.parse(request));assert.equal(r.amount,estimates[id]*10);assert.equal(r.items[0].quantity,10);}
});
