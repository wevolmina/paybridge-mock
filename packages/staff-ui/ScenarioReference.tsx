"use client";
import { useState } from "react";
import { rooms, scenarios, devices, deviceById, formatPrice, quote, type Choice, type RoomId } from "./scenario-reference";
import "./scenario-reference.css";

export default function ScenarioReference({admin=false}:{admin?:boolean}) {
  const [room,setRoom]=useState<RoomId>('bedroom');
  const [selected,setSelected]=useState('sleep');
  const [choices,setChoices]=useState<Choice[]>([]);
  const [filter,setFilter]=useState('all');
  const [message,setMessage]=useState('');
  const s=scenarios.find(s=>s.id===selected)!;
  const choice=choices.find(c=>c.scenarioId===s.id);
  const totals=quote(choices);
  const selectRoom=(id:RoomId)=>{setRoom(id);setSelected(scenarios.find(s=>s.room===id)!.id);};
  const update=(deviceId:string,quantity=choice?.quantity||1)=>setChoices(old=>[...old.filter(c=>c.scenarioId!==s.id),{scenarioId:s.id,deviceId,quantity,checked:false}]);
  const download=()=>{try{const blob=new Blob([JSON.stringify({version:1,kind:'consultation-draft',priceSnapshot:'2026-10-26',choices,totals},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='paybridge-consultation-draft.json';a.click();URL.revokeObjectURL(url);setMessage('상담 구성 파일을 내려받았습니다.');}catch{setMessage('파일을 내려받지 못했습니다. 브라우저 설정을 확인하세요.');}};
  return <section className="sr-panel" aria-label={admin?'상황별 카탈로그 검토':'상황별 구매 상담'}>
    <header><span className="sr-kicker">{admin?'CATALOG REVIEW':'SCENARIO CONSULTATION'} · 16 SCENARIOS</span><h2>{admin?'상황별 카탈로그 검토':'고객의 생활 상황부터 함께 고르세요'}</h2><p>{admin?'네 공간의 16개 상황과 기기별 공식 가격·설치 조건을 검토합니다.':'공간과 상황을 고르면 필요한 기기와 설치 확인 항목을 볼 수 있습니다.'}</p></header>
    <div className="sr-summary"><div><strong>4개 공간 · 16개 상황</strong><span>기기 {devices.length}종</span></div><div><strong>공식 가격 {devices.filter(d=>d.price).length}종</strong><span>확인일 2026-10-26</span></div><div><strong>가격 확인 필요 {devices.filter(d=>!d.price).length}종</strong><span>미확인 가격은 합계에서 제외</span></div></div>
    <p className="sr-notice">공식 판매처의 참고 가격입니다. 배송비·관세·허브·시공비는 별도이며, 실제 주문 가격과 재고는 다시 확인해야 합니다. {admin?'이 화면의 카탈로그는 검토용이며 가격·판매 상태를 서버에 게시하지 않습니다.':'선택한 구성은 상담 초안입니다. 주문 접수·결제·매출 집계에 반영되지 않습니다.'}</p>
    <div className="sr-tabs" role="group" aria-label="공간 선택">{rooms.map(r=><button key={r.id} aria-pressed={room===r.id} onClick={()=>selectRoom(r.id)}>{r.name}<small>{r.caption}</small></button>)}</div>
    <div className="sr-layout"><nav aria-label="상황 선택">{scenarios.filter(x=>x.room===room).map(x=><button key={x.id} aria-pressed={selected===x.id} onClick={()=>setSelected(x.id)}>{x.title}{choices.some(c=>c.scenarioId===x.id)?' · 선택됨':''}</button>)}</nav>
    <article key={s.id}><h3>{s.title}</h3><p>{s.description}</p><ol className="sr-flow">{s.flow.map((step,i)=><li key={i}>{step}</li>)}</ol><div className="sr-check"><strong>설치 전에 확인하세요</strong><p>{s.check}</p></div><p>추가 준비: {s.extras.join(' · ')}</p>
    <div className="sr-options">{s.options.map(id=>{const d=deviceById[id];return <div className="sr-device" key={id}><h4>{d.name}</h4><span>{d.protocol} · {d.power}</span><strong>{formatPrice(d.price)}</strong><p>{d.note||'허브와 자동화 플랫폼의 호환 목록을 확인하세요.'}</p><p>재고: {d.availability}</p>{d.price&&<small>{d.price.market} · {d.price.basis} · {d.price.checkedAt}</small>}{(d.price?.sourceUrl||d.officialUrl)&&<a href={d.price?.sourceUrl||d.officialUrl!} target="_blank" rel="noreferrer">공식 판매처 확인</a>}{!admin&&<button aria-pressed={choice?.deviceId===id} onClick={()=>update(id)}>{choice?.deviceId===id?'선택한 기기':'이 기기로 상담 구성'}</button>}</div>;})}</div>
    {!admin&&choice&&<div className="sr-check"><label>기기 수량 <select aria-label="기기 수량" value={choice.quantity} onChange={e=>update(choice.deviceId,Number(e.target.value))}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}개</option>)}</select></label><label><input type="checkbox" checked={choice.checked} onChange={e=>setChoices(old=>old.map(c=>c.scenarioId===s.id?{...c,checked:e.target.checked}:c))}/> 위 설치 조건을 고객과 함께 확인함</label><button onClick={()=>setChoices(old=>old.filter(c=>c.scenarioId!==s.id))}>이 상황 선택 해제</button></div>}
    </article></div>
    {admin?<details><summary>전체 기기 가격·출처 검토 ({devices.length}종)</summary><label>가격 상태 <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">전체</option><option value="unknown">가격 확인 필요</option><option value="known">공식 가격 확인됨</option></select></label><div className="sr-table"><table><thead><tr><th>기기</th><th>공식 참고 가격</th><th>가격 기준·확인일</th><th>출처</th></tr></thead><tbody>{devices.filter(d=>filter==='all'||(filter==='unknown'?!d.price:!!d.price)).map(d=><tr key={d.id}><th>{d.name}<small>{d.protocol} · {d.availability}</small></th><td>{formatPrice(d.price)}</td><td>{d.price?`${d.price.market} · ${d.price.basis} · ${d.price.checkedAt}`:'공식 판매가 확인 후 갱신 필요'}</td><td>{(d.price?.sourceUrl||d.officialUrl)?<a target="_blank" rel="noreferrer" href={d.price?.sourceUrl||d.officialUrl!}>공식 페이지</a>:'출처 확인 필요'}</td></tr>)}</tbody></table></div></details>:<footer><h3>상담 초안 · {choices.length}/16개 상황</h3>{choices.length?<ul>{choices.map(c=><li key={c.scenarioId}>{scenarios.find(s=>s.id===c.scenarioId)!.title} · {deviceById[c.deviceId].name} × {c.quantity} · 설치 {c.checked?'확인함':'확인 필요'}</li>)}</ul>:<p>상황별 기기를 선택하면 여기에 모입니다.</p>}<strong>확인된 기기 합계: {formatPrice({amount:totals.KRW,currency:'KRW',market:'',basis:'',checkedAt:'',sourceUrl:''})} / US${(totals.USD/100).toFixed(2)}</strong><p>가격 미확인 {totals.unknown}개 · 설치 미확인 {choices.filter(c=>!c.checked).length}개 상황. 같은 기기를 여러 상황에서 고르면 각각 계산합니다. 기기 공유 여부는 상담 시 확인하세요.</p><button disabled={!choices.length} onClick={download}>상담 구성 JSON 내려받기</button><p role="status">{message}</p></footer>}
  </section>;
}
