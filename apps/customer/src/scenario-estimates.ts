import type {Choice} from './smart-home-catalog';
import {estimates} from '../../../packages/scenario-prices';
export {estimates};
export const estimateLabel=(id:string,quantity=1)=>new Intl.NumberFormat('ko-KR').format((estimates[id]??30000)*quantity)+'원';
export const estimateTotal=(choices:Choice[])=>choices.reduce((sum,c)=>sum+(estimates[c.deviceId]??30000)*c.quantity,0);
