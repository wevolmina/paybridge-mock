import * as THREE from 'three';
import type {SceneState,RoomId} from './smart-home-catalog';
export interface ScenarioScene {setState(state:SceneState):void;dispose():void}
/** Self-authored low-poly rooms. Simulation only; no Home Assistant credentials or network calls. */
export function mountScenarioRoom(host:HTMLElement,room:RoomId,onLost:()=>void):ScenarioScene{
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 const canvas=renderer.domElement,materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[];
 let dead=false,frame=0,start=0,state:SceneState|undefined,fromLight=.5,light=.5,fromCurtain=0,curtain=0,fromDoor=0,door=0,moving=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,60),target=new THREE.Vector3(0,.8,0),camTarget=new THREE.Vector3(7,6,8);
 camera.position.copy(camTarget);camera.lookAt(target);
 const material=(color:number)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.85});materials.push(m);return m};
 const cream=material(0xe8e2d4),wood=material(0xad8460),white=material(0xf4f3e8),sage=material(0x789889),dark=material(0x31554c),metal=material(0x9caead);
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;host.append(canvas);canvas.setAttribute('aria-hidden','true');
 scene.add(new THREE.HemisphereLight(0xffffff,0x6d7763,2));const sun=new THREE.DirectionalLight(0xffedd0,3);sun.position.set(4,7,5);scene.add(sun);
 const point=new THREE.PointLight(0xffc76c,20,9,2);point.position.set(.2,2,0);scene.add(point);
 box(6,.18,5,wood,0,-.1,0);box(6,3,.12,cream,0,1.45,-2.5);box(.12,3,5,cream,-3,1.45,0);
 for(let i=0;i<12;i++)box(.012,.01,5,dark,-2.8+i*.5,0,0);
 box(1.9,1.4,.04,material(0xb9dce1),1.4,1.95,-2.4);
 const curtainL=box(.1,1.7,.12,sage,.45,1.9,-2.3),curtainR=box(.1,1.7,.12,sage,2.35,1.9,-2.3);
 const doorPivot=new THREE.Group();doorPivot.position.set(2,0,-1.9);scene.add(doorPivot);const doorPanel=box(.9,1.8,.08,white,.45,.95,0,doorPivot);
 const pressure=box(2,.025,2.9,material(0xdb964f),0,.58,-.1);pressure.visible=false;
 if(room==='bedroom'){
  box(2.55,.3,3.3,wood,0,.28,-.15);box(2.45,.35,3.2,white,0,.6,-.15);box(2.7,1.1,.18,wood,0,.9,-1.9);
  box(2.4,.13,2.2,sage,0,.84,.35);box(1,.15,.6,white,-.6,.9,-1.25);box(1,.15,.6,white,.6,.9,-1.25);
  box(.75,.65,.75,wood,-2,.32,-1.4);box(.3,.5,.3,white,-2,.95,-1.4);
 }else if(room==='kitchen'){
  box(3.7,.95,1.1,sage,-.8,.48,-1.7);box(3.85,.09,1.2,white,-.8,1,-1.7);box(1.1,.03,.7,metal,-1.4,1.06,-1.7);
  box(.9,.9,.04,metal,.4,.5,-1.12);box(1.05,2.25,1.1,white,2,1.12,-1.9);doorPivot.position.set(1.48,0,-1.31);doorPanel.scale.set(1.15,1.22,1);
  box(1.3,.8,.35,white,-1.2,2,-2.3);
 }else if(room==='desk'){
  box(3.5,.1,1.6,wood,0,.98,-.8);for(const x of [-1.5,1.5])for(const z of [-1.4,-.2])box(.08,.98,.08,dark,x,.49,z);
  box(1.35,.85,.08,dark,0,1.6,-1.3);box(1.23,.72,.09,material(0x80bbc1),0,1.6,-1.24);box(.1,.3,.1,metal,0,1.15,-1.3);
  box(.8,.025,.35,white,0,1.06,-.6);box(.22,.04,.22,white,-1,1.07,-.7);box(.5,.04,.3,white,1,1.07,-.8);
 }else{
  box(2,.85,.9,white,-1.5,.43,-1.8);box(1.1,.06,.6,metal,-1.5,.9,-1.8);box(1.1,1.2,.05,metal,-1.5,1.85,-2.4);
  box(1.5,.12,1.8,white,1.6,.06,-1.2);box(.07,2.3,1.8,material(0xbad4d8),.8,1.2,-1.2);box(.65,.55,.85,white,-.8,.3,.7);
 }
 const glowMat=new THREE.MeshBasicMaterial({color:0xffd775,transparent:true,opacity:.3,depthWrite:false});materials.push(glowMat);const glow=box(2.8,.012,3.6,glowMat,0,.02,.1);
 const waterMat=new THREE.MeshBasicMaterial({color:0x63bed7,transparent:true,opacity:.7});materials.push(waterMat);const water=box(1.6,.025,.8,waterMat,-1,.05,-.6);water.visible=false;
 const sensor=box(.15,.08,.15,white,-1.2,.1,.6);const markerMat=new THREE.MeshBasicMaterial({color:0x2b8367});materials.push(markerMat);const marker=box(.11,.22,.11,markerMat,-1.2,.3,.6);
 const zoneMat=new THREE.MeshBasicMaterial({color:0x62c5b0,transparent:true,opacity:.22,depthWrite:false});materials.push(zoneMat);
 const zones=[-1.7,0,1.7].map(x=>box(1.5,.02,1.8,zoneMat,x,.035,.4));zones.forEach(z=>z.visible=false);
 const steamMat=new THREE.MeshBasicMaterial({color:0xc9e9e6,transparent:true,opacity:.25});materials.push(steamMat);const steam=box(1.3,1.9,1.3,steamMat,1.6,1.1,-1.2);steam.visible=false;
 const fan=new THREE.Group();fan.position.set(1,2.5,-2.3);scene.add(fan);box(.55,.55,.06,white,0,0,0,fan);const blade=box(.38,.06,.08,dark,0,0,.08,fan);box(.06,.38,.08,dark,0,0,.08,fan);
 const wiring=box(3.8,.025,.025,material(0xe9b650),0,1.5,-2.35);wiring.visible=false;
 function request(){if(!dead&&!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
 function draw(now:number){frame=0;if(dead||document.hidden)return;const t=reduced.matches?1:Math.min(1,(now-start)/650),e=1-(1-t)**3;
  light=fromLight+((state?.brightness??50)/100-fromLight)*e;curtain=fromCurtain+((state?.curtain??0)/100-fromCurtain)*e;door=fromDoor+((state?.door??0)-fromDoor)*e;
  point.intensity=light*23;point.color.setHex(state?.warm?0xffc76c:0xeaf4ff);glowMat.opacity=light*.45;glow.visible=light>0;point.position.y=state?.scenarioId==='footlight' ? .22 : 2;
  const width=.1+(1-curtain)*.92;curtainL.scale.x=curtainR.scale.x=width/.1;curtainL.position.x=.4+width/2;curtainR.position.x=2.4-width/2;curtainL.visible=curtainR.visible=room==='bedroom';doorPivot.visible=room==='kitchen'||(room==='bathroom'&&state?.scenarioId==='door-light');doorPivot.rotation.y=-door*Math.PI;
  pressure.visible=!!state?.pressure;water.visible=!!state?.wet;markerMat.color.setHex(state?.wet?0xc24c37:0x2b8367);zones.forEach((z,i)=>z.visible=!!state?.presence&&(i===0||state.zones===3));steam.visible=!!state?.fan;fan.visible=room==='bathroom';blade.rotation.z=state?.fan?e*Math.PI*4:0;wiring.visible=!!state?.blueprint;
  pressure.position.y=state?.pressure ? .94 : .58;glow.scale.set(state?.scenarioId==='footlight'?1.1:1,1,1);
  sensor.position.set(room==='bedroom'?-1.2:room==='desk'?-.9:-1.6,state?.scenarioId==='hidden-button' ? .87 : .1,room==='desk'?-.35:.6);marker.position.copy(sensor.position).y+=.2;
  if(reduced.matches)camera.position.set(7,6,8);else camera.position.lerp(camTarget,.18);camera.lookAt(target);renderer.render(scene,camera);moving=t<1;if(moving)request();
 }
 function setState(next:SceneState){fromLight=light;fromCurtain=curtain;fromDoor=door;state={...next};start=performance.now();camTarget.set(next.scenarioId==='hidden-button'?5:7,next.scenarioId==='footlight'?3.7:6,8);request()}
 function resize(){const {width,height}=host.getBoundingClientRect();if(width&&height){camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);request()}}
 function lost(e:Event){e.preventDefault();if(!dead)onLost()}
 function visible(){if(!document.hidden){start=performance.now()-650;request()}}
 const observer=new ResizeObserver(resize);observer.observe(host);canvas.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visible);reduced.addEventListener('change',request);resize();
 return {setState,dispose(){if(dead)return;dead=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',visible);reduced.removeEventListener('change',request);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove()}};
}
