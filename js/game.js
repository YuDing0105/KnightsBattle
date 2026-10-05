import * as THREE from "three";import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
(()=>{"use strict";const names=["剑盾","弓箭","骑兵","斧兵"],pre=["swordsman","archer","cavalry","axe"],N=6,$=s=>document.querySelector(s),B=$("#board");let sword3D=null,swordMixer=null,swordIdle=null,swordAttack=null,swordClock=new THREE.Clock(),swordReady=false,swordAttacking=false,swordAttackQueued=false,weapon3D=null,shield3D=null,warrior3D=null,warriorMixer=null,warriorIdle=null,warriorAttack=null,warriorReady=false,warriorAttacking=false,warriorAttackQueued=false,warriorClock=new THREE.Clock(),axe3D=null;let G=[],total=0,best=0,Q=-1,busy=0,U=[],down=-1;const rnd=()=>Math.floor(Math.random()*4),id=(r,c)=>r*N+c,row=i=>Math.floor(i/N),col=i=>i%N,near=(a,b)=>Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1,wait=n=>new Promise(r=>setTimeout(r,n)),need=l=>5,icon=(t,l)=>pre[t]+"_lv"+l+".png";function make(){G=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){let t=rnd();while((c>1&&G[id(r,c-1)]===t&&G[id(r,c-2)]===t)||(r>1&&G[id(r-1,c)]===t&&G[id(r-2,c)]===t))t=rnd();G.push(t)}}function setupSwordsman3D(){
 const host=document.querySelector("#swordsman3d");if(!host||host.dataset.three)return;
 host.dataset.three="1";host.innerHTML="";host.classList.add("swordsman3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true});const makeLoader=()=>new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));ren.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 makeLoader().load("./swordsman_lv1.glb?v=64",g=>{
  sword3D=g.scene;scene.add(sword3D);
  const raw=new THREE.Box3().setFromObject(sword3D),rawSize=raw.getSize(new THREE.Vector3()),rawCenter=raw.getCenter(new THREE.Vector3());
  sword3D.position.set(-rawCenter.x,-raw.min.y,-rawCenter.z);sword3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;sword3D.scale.setScalar(4.158/Math.max(rawSize.y,.001));
  const fit=new THREE.Box3().setFromObject(sword3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());
  sword3D.position.x-=center.x;sword3D.position.y-=fit.min.y;
  const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(size.y*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,size.y*.5,dist);cam.lookAt(0,size.y*.5,0);
  swordMixer=new THREE.AnimationMixer(sword3D);const clips=g.animations||[],idleClips=clips.filter(a=>/idle/i.test(a.name));
  swordIdle=clips.find(a=>/combat[ _-]*stance/i.test(a.name))||idleClips[0]||null;swordAttack=clips.find(a=>/attack|slash|sword|strike|melee|swing/i.test(a.name))||null;
  if(swordIdle)swordMixer.clipAction(swordIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();swordReady=true;
  const bones=[];sword3D.traverse(o=>{if(o.isBone)bones.push(o)});
  const rightHand=bones.find(o=>/(mixamorigRightHand|right.*hand|hand.*r|r[_ .-]?hand)/i.test(o.name))||null;
  const leftHand=bones.find(o=>/(mixamorigLeftHand|left.*hand|hand.*l|l[_ .-]?hand)/i.test(o.name))||null;
  const attach=(url,hand,kind)=>{
   makeLoader().load(url,obj=>{
    const model=obj.scene,raw=new THREE.Box3().setFromObject(model),rawSize=raw.getSize(new THREE.Vector3()),rawCenter=raw.getCenter(new THREE.Vector3()),axis=Math.max(rawSize.x,rawSize.y,rawSize.z);
    const targetWorld=size.y*(kind==="shield"?.273:.5355),desiredWorldScale=targetWorld/Math.max(axis,.001);
    if(hand){
      const handWorldScale=new THREE.Vector3();hand.getWorldScale(handWorldScale);
      model.scale.set(desiredWorldScale/Math.max(handWorldScale.x,.001),desiredWorldScale/Math.max(handWorldScale.y,.001),desiredWorldScale/Math.max(handWorldScale.z,.001));
      hand.add(model);
      model.position.set(0,0,0);
      if(kind==="sword"){model.position.set(0,.06*size.y,0);model.rotation.set(0,0,0)}
      else{
 model.rotation.set(0,-Math.PI/2,0);
 const fistOffset=size.y*.055;
 const characterForwardWorld=new THREE.Vector3(0,0,1).applyQuaternion(sword3D.getWorldQuaternion(new THREE.Quaternion())).normalize();
 const handWorldQuat=hand.getWorldQuaternion(new THREE.Quaternion());
 const localForward=characterForwardWorld.clone().applyQuaternion(handWorldQuat.clone().invert()).normalize();
 model.position.add(localForward.multiplyScalar(fistOffset/Math.max((handWorldScale.x+handWorldScale.y+handWorldScale.z)/3,.001)));
}
    }else{
      model.scale.setScalar(desiredWorldScale);sword3D.add(model);
      model.position.set(kind==="sword"?.3*size.x:-.3*size.x,.48*size.y,.08*size.z);
      if(kind==="shield")model.rotation.y=Math.PI/2;
    }
    model.visible=true;model.traverse(n=>{n.visible=true;if(n.isMesh){n.frustumCulled=false;n.castShadow=false}});
    if(kind==="sword")weapon3D=model;else shield3D=model;
    console.info("KB "+kind+" loaded",hand?("attached to "+hand.name):"fallback");
   },undefined,e=>console.error("KB "+kind+" load failed",e));
  };
  attach("./sword_lv1.glb?v=64",rightHand,"sword");attach("./shield_lv1.glb?v=64",leftHand,"shield");
 },undefined,e=>{console.error("KB swordsman load failed",e);host.innerHTML='<div style="color:#ffcc66;font-size:9px">3D load: '+(e&&e.message?e.message:"unknown")+'</div>'});
 function loop(){requestAnimationFrame(loop);if(swordMixer)swordMixer.update(Math.min(swordClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function setupWarrior3D(){
 const host=document.querySelector("#warrior3d");if(!host||host.dataset.three)return;host.dataset.three="1";host.innerHTML="";host.classList.add("warrior3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true}),loader=new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));ren.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 loader.load("./Warrior.glb?v=64",g=>{warrior3D=g.scene;scene.add(warrior3D);const raw=new THREE.Box3().setFromObject(warrior3D),rs=raw.getSize(new THREE.Vector3()),rc=raw.getCenter(new THREE.Vector3());
 warrior3D.position.set(-rc.x,-raw.min.y,-rc.z);warrior3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;warrior3D.scale.setScalar(4.158/Math.max(rs.y,.001));
 const fit=new THREE.Box3().setFromObject(warrior3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());warrior3D.position.x-=center.x;warrior3D.position.y-=fit.min.y;
 const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(size.y*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,size.y*.5,dist);cam.lookAt(0,size.y*.5,0);
 warriorMixer=new THREE.AnimationMixer(warrior3D);const clips=g.animations||[];warriorIdle=clips.find(a=>/combat[ _-]*stance|idle/i.test(a.name))||null;warriorAttack=clips.find(a=>/^attack$|attack/i.test(a.name))||null;
 if(warriorIdle)warriorMixer.clipAction(warriorIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();warriorReady=true;
 const bones=[];warrior3D.traverse(o=>{if(o.isBone)bones.push(o)});const rightHand=bones.find(o=>/(mixamorigRightHand|right.*hand|hand.*r|r[_ .-]?hand)/i.test(o.name))||null;
 loader.load("./Axe.glb?v=64",ag=>{axe3D=ag.scene;const b=new THREE.Box3().setFromObject(axe3D),s=b.getSize(new THREE.Vector3()),axis=Math.max(s.x,s.y,s.z),target=size.y*.5355,scale=target/Math.max(axis,.001);
 if(rightHand){const hs=new THREE.Vector3();rightHand.getWorldScale(hs);axe3D.scale.set(scale/Math.max(hs.x,.001),scale/Math.max(hs.y,.001),scale/Math.max(hs.z,.001));rightHand.add(axe3D);axe3D.position.set(0,.06*size.y,0)}
 else{axe3D.scale.setScalar(scale);warrior3D.add(axe3D);axe3D.position.set(.3*size.x,.48*size.y,.08*size.z)}axe3D.traverse(n=>{if(n.isMesh)n.frustumCulled=false})});
 },undefined,e=>console.error("KB warrior load failed",e));
 function loop(){requestAnimationFrame(loop);if(warriorMixer)warriorMixer.update(Math.min(warriorClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function playWarriorAttack(){if(!warriorReady||!warriorMixer||!warriorAttack)return;if(warriorAttacking){warriorAttackQueued=true;return}warriorAttacking=true;const p=warrior3D.position.clone(),q=warrior3D.quaternion.clone(),idle=warriorIdle?warriorMixer.clipAction(warriorIdle):null,atk=warriorMixer.clipAction(warriorAttack);atk.reset().setLoop(THREE.LoopOnce,1);atk.clampWhenFinished=true;if(idle)idle.crossFadeTo(atk,.12,false);atk.play();const done=e=>{if(e.action!==atk)return;warriorMixer.removeEventListener("finished",done);warrior3D.position.copy(p);warrior3D.quaternion.copy(q);warriorAttacking=false;if(warriorAttackQueued){warriorAttackQueued=false;atk.stop();playWarriorAttack();return}if(idle){atk.crossFadeTo(idle,.12,false);idle.reset().play()}else atk.stop()};warriorMixer.addEventListener("finished",done)}
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
function draw(){B.innerHTML="";G.forEach((t,i)=>{let b=document.createElement("button");b.type="button";b.className="tile"+(i===Q?" selected":"");b.dataset.i=i;let im=document.createElement("img");im.src=icon(t,U[t].l);im.alt=names[t];b.appendChild(im);B.appendChild(b)});$("#totalDamage").textContent=total;$("#bestDamage").textContent=best;if(!$("#units").children.length){$("#units").innerHTML=U.map((u,i)=>'<div class="unit"><div class="icon"'+(i===0?' id="swordsman3d"':i===3?' id="warrior3d"':'')+'>'+((i===0||i===3)?'':'<img data-unit="'+i+'" src="'+icon(i,u.l)+'">')+'</div></div>').join("");setupSwordsman3D();setupWarrior3D()}else{U.forEach((u,i)=>{if(i===0||i===3)return;let im=document.querySelector('#units img[data-unit="'+i+'"]');if(im)im.src=icon(i,u.l)})}}function find(){let z=new Set(),a=[];for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c<N&&G[id(r,c)]===G[id(r,s)])continue;if(c-s>=3){let q=[];for(let k=s;k<c;k++){z.add(id(r,k));q.push(id(r,k))}a.push(q)}s=c}}for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r<N&&G[id(r,c)]===G[id(s,c)])continue;if(r-s>=3){let q=[];for(let k=s;k<r;k++){z.add(id(k,c));q.push(id(k,c))}a.push(q)}s=r}}return{ids:[...z],groups:a}}function pop(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}function reward(m,ch){let p=0,C=[0,0,0,0];m.groups.forEach(g=>p+=g.length>=5?10:g.length===4?3:1);p*=ch;m.ids.forEach(i=>C[G[i]]++);C.forEach((n,t)=>{if(!n)return;if(t===0)playSwordAttack();if(t===3)playWarriorAttack();U[t].x+=n;while(U[t].l<4&&U[t].x>=need(U[t].l)){U[t].x-=need(U[t].l);U[t].l++}});let d=0;C.forEach((n,t)=>d+=n*(4+U[t].l*3));d=Math.round(d*ch);total+=d;best=Math.max(best,d);$("#scorePop").textContent="+"+p+(ch>1?" COMBO ×"+ch:"");pop($("#scorePop"),"go");$("#damage").textContent="-"+d;pop($("#damage"),"go");draw()}function fall(ids){let x=new Set(ids);for(let c=0;c<N;c++){let k=[];for(let r=N-1;r>=0;r--)if(!x.has(id(r,c)))k.push(G[id(r,c)]);for(let r=N-1,n=0;r>=0;r--,n++)G[id(r,c)]=n<k.length?k[n]:rnd()}}async function resolve(){let ch=1;while(1){let m=find();if(!m.ids.length)break;reward(m,ch);m.ids.forEach(i=>B.children[i]&&B.children[i].classList.add("kill"));await wait(420);fall(m.ids);draw();await wait(130);ch++}}function end(){}async function swap(a,b){if(busy||!near(a,b))return;busy=1;B.children[a]?.classList.add("swap");B.children[b]?.classList.add("swap");await wait(250);[G[a],G[b]]=[G[b],G[a]];draw();await wait(80);if(!find().ids.length){[G[a],G[b]]=[G[b],G[a]];draw();$("#hint").textContent="该交换没有形成三消。";busy=0;return}await resolve();draw();busy=0}function choose(i){if(busy)return;if(Q<0){Q=i;draw()}else if(Q===i){Q=-1;draw()}else if(near(Q,i)){let a=Q;Q=-1;swap(a,i)}else{Q=i;draw()}}function reset(){total=0;best=0;Q=-1;busy=0;U=Array.from({length:4},()=>({l:1,x:0}));$("#hint").textContent="拖动图标，或点击两个相邻图标交换。";make();draw()}B.addEventListener("click",e=>{let t=e.target.closest(".tile");if(t)choose(+t.dataset.i)});let startX=0,startY=0;
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