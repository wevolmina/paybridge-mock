import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {Pool,RowDataPacket} from 'mysql2/promise';
import {scenarios,deviceById,rooms} from '../../customer/src/smart-home-catalog';
import {estimates} from '../../../packages/scenario-prices';
import {storedReceipt,type StoredReceipt} from './checkout';
import {payloadHash} from './payments';

export const scenarioInput=z.object({
 requestId:z.string().uuid(),
 expectedTotal:z.number().int().positive(),
 items:z.array(z.object({scenarioId:z.string(),deviceId:z.string(),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(16)
 .refine(items=>new Set(items.map(i=>i.scenarioId)).size===items.length,'Duplicate scenario')
 .refine(items=>items.every(i=>scenarios.find(s=>s.id===i.scenarioId)?.options.includes(i.deviceId)&&Number.isInteger(estimates[i.deviceId])),'Unknown product'),
}).strict();
export type ScenarioInput=z.infer<typeof scenarioInput>;
export function scenarioLines(input:ScenarioInput){
 return [...input.items].sort((a,b)=>a.scenarioId.localeCompare(b.scenarioId,'en')).map(i=>{
 const s=scenarios.find(s=>s.id===i.scenarioId)!,d=deviceById[i.deviceId];
 return {productId:'sc-'+createHash('sha256').update(s.id+':'+d.id).digest('hex').slice(0,24),productName:rooms.find(r=>r.id===s.room)!.name+' / '+s.title+' / '+d.name,unitPrice:estimates[d.id],quantity:i.quantity,lineTotal:estimates[d.id]*i.quantity,room:s.room,scenarioId:s.id,deviceId:d.id};
 });
}
export function scenarioHash(input:ScenarioInput){return createHash('sha256').update(JSON.stringify(['scenario-order-v1',scenarioLines(input).map(i=>[i.productId,i.quantity]),input.expectedTotal])).digest('hex')}
export function buildScenario(uid:string,input:ScenarioInput,now=new Date()):StoredReceipt{
 const lines=scenarioLines(input),amount=lines.reduce((n,i)=>n+i.lineTotal,0);
 if(amount!==input.expectedTotal)throw Error('PRICE_CHANGED');
 const key=createHash('sha256').update(uid+':'+input.requestId).digest('hex').slice(0,40);
 return {paymentId:'pay_'+key,orderId:'ord_'+key,customerId:uid,merchantId:'studio-mina',productId:'scenario-cart',productName:'스마트홈 기기 구성 '+lines.length+'종',quantity:1,amount,currency:'KRW',status:'MOCK_APPROVED',createdAt:now.toISOString(),items:lines.map(({productId,productName,unitPrice,quantity,lineTotal})=>({productId,productName,unitPrice,quantity,lineTotal}))};
}
export async function existingScenario(pool:Pool,uid:string,input:ScenarioInput){
 const [rows]=await pool.execute<RowDataPacket[]>('SELECT p.*,o.request_hash FROM orders o JOIN payments p ON p.order_id=o.order_id WHERE o.customer_id=? AND o.request_id=?',[uid,input.requestId]);
 if(!rows.length)return null;
 if(rows[0].request_hash!==scenarioHash(input))throw Error('REQUEST_CONFLICT');
 return storedReceipt(pool,rows[0]);
}
export async function confirmScenario(pool:Pool,uid:string,input:ScenarioInput){
 const p=buildScenario(uid,input),hash=scenarioHash(input),c=await pool.getConnection(),time=p.createdAt.slice(0,23).replace('T',' ');
 try{
 await c.beginTransaction();
 await c.execute('INSERT INTO orders (order_id,customer_id,request_id,request_hash,merchant_id,amount,currency,status,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE order_id=order_id',[p.orderId,uid,input.requestId,hash,p.merchantId,p.amount,p.currency,p.status,time]);
 const [orders]=await c.execute<RowDataPacket[]>('SELECT request_hash FROM orders WHERE order_id=? FOR UPDATE',[p.orderId]);
 if(orders[0]?.request_hash!==hash)throw Error('REQUEST_CONFLICT');
 const [old]=await c.execute<RowDataPacket[]>('SELECT * FROM payments WHERE payment_id=?',[p.paymentId]);
 if(old.length){const prior=await storedReceipt(c,old[0]);await c.commit();return prior;}
 for(const [index,line] of scenarioLines(input).entries()){
 // Provision only known server catalog products. Existing prices/visibility are never overwritten.
 await c.execute('INSERT IGNORE INTO spaces (space_id,name,description) VALUES (?,?,?)',[line.room,rooms.find(r=>r.id===line.room)!.name,'스마트홈 생활 장면']);
 await c.execute('INSERT IGNORE INTO packages (product_id,space_id,merchant_id,name,description,unit_price) VALUES (?,?,?,?,?,?)',[line.productId,line.room,p.merchantId,line.productName,'생활 장면별 기기 · 모의 구매 예상가',line.unitPrice]);
 const [rows]=await c.execute<RowDataPacket[]>('SELECT name,unit_price,merchant_id,active FROM packages WHERE product_id=? FOR SHARE',[line.productId]);
 const product=rows[0];if(!product?.active)throw Error('PRODUCT_UNAVAILABLE');
 if(Number(product.unit_price)!==line.unitPrice||product.name!==line.productName||product.merchant_id!==p.merchantId)throw Error('PRICE_CHANGED');
 await c.execute('INSERT INTO order_items (order_id,line_number,product_id,product_name,unit_price,quantity) VALUES (?,?,?,?,?,?)',[p.orderId,index+1,line.productId,line.productName,line.unitPrice,line.quantity]);
 }
 // payments.quantity is one configured order; exact device counts live in order_items.
 await c.execute('INSERT INTO payments (payment_id,order_id,customer_id,merchant_id,product_id,product_name,quantity,amount,currency,status,created_at,payload_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[p.paymentId,p.orderId,uid,p.merchantId,p.productId,p.productName,1,p.amount,p.currency,p.status,time,payloadHash(p)]);
 await c.commit();return p;
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
