import {getFirestore} from 'firebase-admin/firestore';
import {authorizedUser} from '../../../lib/admin';
import {getPool} from '../../../lib/mysql';
import {cors,options} from '../../../lib/http';
import {scenarioInput,scenarioHash,existingScenario,confirmScenario,buildScenario} from '../../../lib/scenario-order';
export const runtime='nodejs';export const dynamic='force-dynamic';export const OPTIONS=options;
export async function POST(request:Request){
 const headers=cors(request),user=await authorizedUser(request);
 if(!user||user.claims.firebase?.sign_in_provider==='anonymous')return Response.json({error:'AUTH_REQUIRED'},{status:401,headers});
 const text=await request.text();if(Buffer.byteLength(text)>8192)return Response.json({error:'INPUT_TOO_LARGE'},{status:413,headers});
 let body:unknown;try{body=JSON.parse(text)}catch{return Response.json({error:'INVALID_INPUT'},{status:400,headers})}
 const parsed=scenarioInput.safeParse(body);if(!parsed.success)return Response.json({error:'INVALID_INPUT'},{status:400,headers});
 const input=parsed.data;
 try{
 const pool=getPool(),prior=await existingScenario(pool,user.uid,input);if(prior)return Response.json(prior,{headers});
 const order=buildScenario(user.uid,input),hash=scenarioHash(input);
 // Server validates identity, every product and price before immutable intake.
 // The default Firestore instance is the same native instance used by existing intake.
 const db=getFirestore(),ref=db.collection('smartspace_scenario_requests').doc(order.orderId);
 await db.runTransaction(async tx=>{const old=await tx.get(ref);if(old.exists){const data=old.data();if(data?.customerId!==user.uid||data?.requestHash!==hash)throw Error('REQUEST_CONFLICT');return;}
 tx.create(ref,{customerId:user.uid,requestId:input.requestId,requestHash:hash,items:input.items,expectedTotal:input.expectedTotal,mode:'mock',createdAt:new Date().toISOString()});});
 return Response.json(await confirmScenario(pool,user.uid,input),{headers});
 }catch(e){const code=e instanceof Error?e.message:'';const conflict=['REQUEST_CONFLICT','PRICE_CHANGED','PRODUCT_UNAVAILABLE'].includes(code);
 return Response.json({error:conflict?code:'CHECKOUT_UNAVAILABLE'},{status:conflict?409:503,headers});}
}
