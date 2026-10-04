import * as THREE from "three";import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
(()=>{"use strict";const names=["剑盾","弓箭","骑兵","斧兵"],pre=["swordsman","archer","cavalry","axe"],N=6,$=s=>document.querySelector(s),B=$("#board");let sword3D=null,swordMixer=null,swordIdle=null,swordAttack=null,swordClock=new THREE.Clock(),swordReady=false,swordAttacking=false,swordAttackQueued=false,weapon3D=null;let G=[],total=0,best=0,Q=-1,busy=0,U=[],down=-1;const rnd=()=>Math.floor(Math.random()*4),id=(r,c)=>r*N+c,row=i=>Math.floor(i/N),col=i=>i%N,near=(a,b)=>Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1,wait=n=>new Promise(r=>setTimeout(r,n)),need=l=>5,icon=(t,l)=>pre[t]+"_lv"+l+".png";function make(){G=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){let t=rnd();while((c>1&&G[id(r,c-1)]===t&&G[id(r,c-2)]===t)||(r>1&&G[id(r-1,c)]===t&&G[id(r-2,c)]===t))t=rnd();G.push(t)}}function setupSwordsman3D(){
 const host=document.querySelector("#swordsman3d"); if(!host||host.dataset.three)return;
 host.dataset.three="1";host.innerHTML="";host.classList.add("swordsman3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true});
 ren.setPixelRatio(Math.min(devicePixelRatio,2));const syncSize=()=>{const w=host.clientWidth||209,h=host.clientHeight||180;cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};syncSize();window.addEventListener("resize",syncSize);ren.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(ren.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));let dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 cam.position.set(4.8,1.05,5.4);cam.lookAt(0,1.05,0);
 new GLTFLoader().load("swordsman_lv1.glb?v=52",g=>{sword3D=g.scene;scene.add(sword3D);let box=new THREE.Box3().setFromObject(sword3D),sz=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());sword3D.position.set(-ctr.x,-box.min.y,-ctr.z);sword3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;sword3D.scale.setScalar(4.158/Math.max(sz.y,.01));const fitBox=new THREE.Box3().setFromObject(sword3D),fitSize=fitBox.getSize(new THREE.Vector3()),fitCenter=fitBox.getCenter(new THREE.Vector3());sword3D.position.x-=fitCenter.x;sword3D.position.y-=fitBox.min.y;const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(fitSize.y*.62)/Math.tan(vfov/2);cam.position.set(dist*.72,fitSize.y*.52,dist);cam.lookAt(0,fitSize.y*.52,0);swordMixer=new THREE.AnimationMixer(sword3D);let clips=g.animations||[];window.KB_SWORDSMAN_ANIMATIONS=clips.map(a=>a.name);console.info("KB Swordsman animations:",window.KB_SWORDSMAN_ANIMATIONS);
const idleClips=clips.filter(a=>/idle/i.test(a.name));swordIdle=clips.find(a=>/combat[ _-]*stance/i.test(a.name))||idleClips[0]||null;swordAttack=clips.find(a=>/attack|slash|sword|strike|melee|swing/i.test(a.name))||null;
const panel=document.querySelector("#animButtons"),status=document.querySelector("#animStatus");if(status)status.textContent="已读取 "+clips.length+" 个动画";if(panel){panel.innerHTML="";clips.forEach((clip,i)=>{let b=document.createElement("button");b.style.cssText="min-height:34px;padding:5px 8px;background:#211b18;color:white;border:2px solid #d5a44d;border-radius:6px;";b.type="button";b.textContent=(i+1)+" · "+clip.name+" · "+clip.duration.toFixed(2)+"s";b.onclick=()=>{swordMixer.stopAllAction();let a=swordMixer.clipAction(clip);a.reset();if(/idle/i.test(clip.name))a.setLoop(THREE.LoopRepeat,Infinity);else{a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true}a.play();document.querySelectorAll("#animButtons button").forEach(x=>x.classList.remove("active"));b.classList.add("active")};panel.appendChild(b)})}
if(swordIdle)swordMixer.clipAction(swordIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();swordReady=true;
const handCandidates=[];sword3D.traverse(o=>{if(o.isBone&&/(right.*hand|hand.*r|r[_ .-]?hand|mixamorigRightHand)/i.test(o.name))handCandidates.push(o)});
const rightHand=handCandidates[0]||null;
new GLTFLoader().load("sword_lv1.glb?v=52",wg=>{
 weapon3D=wg.scene;
 let wb=new THREE.Box3().setFromObject(weapon3D),wsz=wb.getSize(new THREE.Vector3()),wctr=wb.getCenter(new THREE.Vector3());
 const charBox=new THREE.Box3().setFromObject(sword3D),charSize=charBox.getSize(new THREE.Vector3());
 const longAxis=Math.max(wsz.x,wsz.y,wsz.z),target=charSize.y*.21,ws=target/Math.max(longAxis,.001);
 weapon3D.scale.setScalar(ws);
 weapon3D.position.set(-wctr.x*ws,-wb.min.y*ws,-wctr.z*ws);
 weapon3D.rotation.set(0,0,0);
 if(rightHand){rightHand.add(weapon3D);console.info("KB sword attached to",rightHand.name)}
 else{sword3D.add(weapon3D);weapon3D.position.set(.35*charSize.x,.48*charSize.y,.08*charSize.z);weapon3D.rotation.z=-.25;console.warn("KB right hand bone not found; sword fallback attached to character")}
},undefined,e=>console.error("KB sword load failed",e));
});
 function loop(){requestAnimationFrame(loop);let d=swordClock.getDelta();if(swordMixer)swordMixer.update(d);ren.render(scene,cam)}loop();
}
function playSwordAttack(){
 if(!swordReady||!swordMixer||!swordAttack)return;
 if(swordAttacking){swordAttackQueued=true;return}
 swordAttacking=true;
 const lockedPos=sword3D.position.clone(),lockedQuat=sword3D.quaternion.clone();
 const idle=swordIdle?swordMixer.clipAction(swordIdle):null,atk=swordMixer.clipAction(swordAttack);
 atk.reset();atk.enabled=true;atk.setEffectiveWeight(1);atk.setEffectiveTimeScale(1);atk.setLoop(THREE.LoopOnce,1);atk.clampWhenFinished=true;
 if(idle)idle.crossFadeTo(atk,.12,false);atk.play();
 const done=e=>{
  if(e.action!==atk)return;
  swordMixer.removeEventListener("finished",done);
  sword3D.position.copy(lockedPos);sword3D.quaternion.copy(lockedQuat);
  swordAttacking=false;
  if(swordAttackQueued){swordAttackQueued=false;atk.stop();playSwordAttack();return}
  if(idle){atk.crossFadeTo(idle,.12,false);idle.reset().enabled=true;idle.setEffectiveWeight(1);idle.play()}else atk.stop();
 };
 swordMixer.addEventListener("finished",done);
}
function draw(){B.innerHTML="";G.forEach((t,i)=>{let b=document.createElement("button");b.type="button";b.className="tile"+(i===Q?" selected":"");b.dataset.i=i;let im=document.createElement("img");im.src=icon(t,U[t].l);im.alt=names[t];b.appendChild(im);B.appendChild(b)});$("#totalDamage").textContent=total;$("#bestDamage").textContent=best;if(!$("#units").children.length){$("#units").innerHTML=U.map((u,i)=>'<div class="unit"><div class="icon"'+(i===0?' id="swordsman3d"':'')+'>'+(i===0?'':'<img data-unit="'+i+'" src="'+icon(i,u.l)+'">')+'</div></div>').join("");setupSwordsman3D()}else{U.forEach((u,i)=>{if(i===0)return;let im=document.querySelector('#units img[data-unit="'+i+'"]');if(im)im.src=icon(i,u.l)})}}function find(){let z=new Set(),a=[];for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c<N&&G[id(r,c)]===G[id(r,s)])continue;if(c-s>=3){let q=[];for(let k=s;k<c;k++){z.add(id(r,k));q.push(id(r,k))}a.push(q)}s=c}}for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r<N&&G[id(r,c)]===G[id(s,c)])continue;if(r-s>=3){let q=[];for(let k=s;k<r;k++){z.add(id(k,c));q.push(id(k,c))}a.push(q)}s=r}}return{ids:[...z],groups:a}}function pop(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}function reward(m,ch){let p=0,C=[0,0,0,0];m.groups.forEach(g=>p+=g.length>=5?10:g.length===4?3:1);p*=ch;m.ids.forEach(i=>C[G[i]]++);C.forEach((n,t)=>{if(!n)return;if(t===0)playSwordAttack();U[t].x+=n;while(U[t].l<4&&U[t].x>=need(U[t].l)){U[t].x-=need(U[t].l);U[t].l++}});let d=0;C.forEach((n,t)=>d+=n*(4+U[t].l*3));d=Math.round(d*ch);total+=d;best=Math.max(best,d);$("#scorePop").textContent="+"+p+(ch>1?" COMBO ×"+ch:"");pop($("#scorePop"),"go");$("#damage").textContent="-"+d;pop($("#damage"),"go");draw()}function fall(ids){let x=new Set(ids);for(let c=0;c<N;c++){let k=[];for(let r=N-1;r>=0;r--)if(!x.has(id(r,c)))k.push(G[id(r,c)]);for(let r=N-1,n=0;r>=0;r--,n++)G[id(r,c)]=n<k.length?k[n]:rnd()}}async function resolve(){let ch=1;while(1){let m=find();if(!m.ids.length)break;reward(m,ch);m.ids.forEach(i=>B.children[i]&&B.children[i].classList.add("kill"));await wait(420);fall(m.ids);draw();await wait(130);ch++}}function end(){}async function swap(a,b){if(busy||!near(a,b))return;busy=1;B.children[a]?.classList.add("swap");B.children[b]?.classList.add("swap");await wait(250);[G[a],G[b]]=[G[b],G[a]];draw();await wait(80);if(!find().ids.length){[G[a],G[b]]=[G[b],G[a]];draw();$("#hint").textContent="该交换没有形成三消。";busy=0;return}await resolve();draw();busy=0}function choose(i){if(busy)return;if(Q<0){Q=i;draw()}else if(Q===i){Q=-1;draw()}else if(near(Q,i)){let a=Q;Q=-1;swap(a,i)}else{Q=i;draw()}}function reset(){total=0;best=0;Q=-1;busy=0;U=Array.from({length:4},()=>({l:1,x:0}));$("#hint").textContent="拖动图标，或点击两个相邻图标交换。";make();draw()}B.addEventListener("click",e=>{let t=e.target.closest(".tile");if(t)choose(+t.dataset.i)});let startX=0,startY=0;
B.addEventListener("pointerdown",e=>{
 let t=e.target.closest(".tile"); if(!t)return;
 down=+t.dataset.i; startX=e.clientX; startY=e.clientY;
 try{B.setPointerCapture(e.pointerId)}catch(_){}
});
B.addEventListener("pointerup",e=>{
 if(down<0)return;
 let dx=e.clientX-startX,dy=e.clientY-startY,to=-1;
 if(Math.max(Math.abs(dx),Math.abs(dy))>14){
   let r=row(down),c=col(down);
   if(Math.abs(dx)>Math.abs(dy)) c+=dx>0?1:-1;
   else r+=dy>0?1:-1;
   if(r>=0&&r<N&&c>=0&&c<N)to=id(r,c);
 }
 if(to>=0&&near(down,to)){Q=-1;swap(down,to)}
 down=-1;
});
B.addEventListener("pointercancel",()=>{down=-1});
B.addEventListener("touchmove",e=>{if(down>=0)e.preventDefault()},{passive:false});$("#restart").onclick=reset;reset()})();