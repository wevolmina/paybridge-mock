import type {Choice} from './smart-home-catalog';
// Demo estimates only. These are not catalog prices and must not be submitted as checkout amounts.
export const estimates:Record<string,number>={"badring":15000,"aqara-leak":40000,"aqara-button":23000,"aqara-door":25000,"aqara-climate":30000,"fp2":130000,"inspelning":25000,"fp1e":70000,"sonoff-climate":25000,"sonoff-button":15000,"sonoff-door":18000,"sonoff-presence":40000,"sonoff-relay":25000,"somrig":15000,"vallhorn":15000,"parasoll":15000,"p1":35000,"tradfri":20000,"curtain-robot":90000,"moes-4":20000,"zy-m100":30000,"tuya-plug":30000,"aqara-h1":60000,"mattress-diy":45000};
export const estimateLabel=(id:string,quantity=1)=>new Intl.NumberFormat('ko-KR').format((estimates[id]??30000)*quantity)+'원';
export const estimateTotal=(choices:Choice[])=>choices.reduce((sum,c)=>sum+(estimates[c.deviceId]??30000)*c.quantity,0);
