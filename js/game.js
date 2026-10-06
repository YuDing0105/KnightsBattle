import * as THREE from "three";import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
(()=>{"use strict";const names=["剑盾","弓箭","骑兵","斧兵"],pre=["swordsman","archer","cavalry","axe"],N=6,$=s=>document.querySelector(s),B=$("#board");let sword3D=null,swordMixer=null,swordIdle=null,swordAttack=null,swordClock=new THREE.Clock(),swordReady=false,swordAttacking=false,swordAttackQueued=false,weapon3D=null,shield3D=null,warrior3D=null,warriorMixer=null,warriorIdle=null,warriorAttack=null,warriorReady=false,warriorAttacking=false,warriorAttackQueued=false,warriorClock=new THREE.Clock(),axe3D=null,archer3D=null,archerMixer=null,archerIdle=null,archerAttack=null,archerReady=false,archerAttacking=false,archerAttackQueued=false,archerClock=new THREE.Clock();let G=[],total=0,best=0,Q=-1,busy=0,U=[],down=-1;const rnd=()=>Math.floor(Math.random()*4),id=(r,c)=>r*N+c,row=i=>Math.floor(i/N),col=i=>i%N,near=(a,b)=>Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1,wait=n=>new Promise(r=>setTimeout(r,n)),need=l=>5,ICON_ASSET_VERSION="87",icon=(t,l)=>pre[t]+"_lv"+l+".png?v="+ICON_ASSET_VERSION;
const iconCache=new Map();
function preloadIcons(){
 for(let t=0;t<pre.length;t++)for(let l=1;l<=4;l++){
  const src=icon(t,l);const im=new Image();im.decoding="async";im.src=src;iconCache.set(src,im);
 }
}
function setIconInstant(im,src){
 const cached=iconCache.get(src);
 if(cached&&cached.complete&&cached.naturalWidth){im.src=cached.src;return}
 const next=cached||new Image();next.src=src;iconCache.set(src,next);
 if(next.decode)next.decode().catch(()=>{}).finally(()=>{im.src=src});else im.src=src;
}function make(){G=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){let t=rnd();while((c>1&&G[id(r,c-1)]===t&&G[id(r,c-2)]===t)||(r>1&&G[id(r-1,c)]===t&&G[id(r-2,c)]===t))t=rnd();G.push(t)}}function setupSwordsman3D(){
 const host=document.querySelector("#swordsman3d");if(!host||host.dataset.three)return;
 host.dataset.three="1";host.innerHTML="";host.classList.add("swordsman3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true});const makeLoader=()=>new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));ren.outputColorSpace=THREE.SRGBColorSpace;ren.setClearColor(0x000000,0);ren.domElement.style.cssText="display:block;width:100%;height:100%;position:absolute;inset:0;z-index:5";host.style.position="relative";host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 makeLoader().load("./swordsman_512.glb",g=>{
  sword3D=g.scene;scene.add(sword3D);
  const raw=new THREE.Box3().setFromObject(sword3D),rawSize=raw.getSize(new THREE.Vector3()),rawCenter=raw.getCenter(new THREE.Vector3());
  sword3D.position.set(-rawCenter.x,-raw.min.y,-rawCenter.z);sword3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;sword3D.scale.setScalar((4.158*1.0117125)/Math.max(rawSize.y,.001));
  const fit=new THREE.Box3().setFromObject(sword3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());
  sword3D.position.x-=center.x;sword3D.position.y-=fit.min.y;
  // IMPORTANT: camera framing must stay tied to the original baseline size.
  // Previously it used the post-scale size, so every model enlargement moved the camera back by the same ratio and visually cancelled the scale change.
  const baselineHeight=size.y/1.0117125;
  const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(baselineHeight*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,baselineHeight*.5,dist);cam.lookAt(0,baselineHeight*.5,0);
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
      if(kind==="sword"){model.position.set(0,.06*size.y,0);model.rotation.set(0,Math.PI/2,0)}
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
  attach("./sword_256.glb",rightHand,"sword");attach("./shield_256.glb",leftHand,"shield");
 },undefined,e=>{console.error("KB swordsman load failed",e);host.innerHTML='<div style="color:#ffcc66;font-size:9px">3D load: '+(e&&e.message?e.message:"unknown")+'</div>'});
 function loop(){requestAnimationFrame(loop);if(document.hidden)return;if(swordMixer)swordMixer.update(Math.min(swordClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function setupWarrior3D(){
 const host=document.querySelector("#warrior3d");if(!host||host.dataset.three)return;host.dataset.three="1";host.innerHTML="";host.classList.add("warrior3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true}),loader=new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));ren.outputColorSpace=THREE.SRGBColorSpace;ren.setClearColor(0x000000,0);ren.domElement.style.cssText="display:block;width:100%;height:100%;position:absolute;inset:0;z-index:5";host.style.position="relative";host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 loader.load("./Warrior_512.glb",g=>{warrior3D=g.scene;scene.add(warrior3D);const raw=new THREE.Box3().setFromObject(warrior3D),rs=raw.getSize(new THREE.Vector3()),rc=raw.getCenter(new THREE.Vector3());
 warrior3D.position.set(-rc.x,-raw.min.y,-rc.z);warrior3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;warrior3D.scale.setScalar(4.158/Math.max(rs.y,.001));
 const fit=new THREE.Box3().setFromObject(warrior3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());warrior3D.position.x-=center.x;warrior3D.position.y-=fit.min.y;
 const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(size.y*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,size.y*.5,dist);cam.lookAt(0,size.y*.5,0);
 warriorMixer=new THREE.AnimationMixer(warrior3D);const clips=g.animations||[];window.KB_WARRIOR_ANIMATIONS=clips.map((a,i)=>({index:i+1,name:a.name,duration:a.duration}));console.table(window.KB_WARRIOR_ANIMATIONS);warriorIdle=clips.find(a=>a.name==="Idle_5")||clips.find(a=>a.name.replace(/[ _-]/g,"").toLowerCase()==="idle5")||null;console.info("KB Warrior animations:",clips.map(a=>a.name),"selected idle:",warriorIdle?.name);warriorAttack=clips.find(a=>a.name==="Axe_Spin_Attack")||clips.find(a=>/attack/i.test(a.name))||null;
 if(warriorIdle)warriorMixer.clipAction(warriorIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();warriorReady=true;
 const bones=[];warrior3D.traverse(o=>{if(o.isBone)bones.push(o)});const rightHand=bones.find(o=>/(mixamorigRightHand|right.*hand|hand.*r|r[_ .-]?hand)/i.test(o.name))||null;
 loader.load("./Axe_512.glb",ag=>{
 axe3D=ag.scene;
 const rawBox=new THREE.Box3().setFromObject(axe3D),rawSize=rawBox.getSize(new THREE.Vector3()),axis=Math.max(rawSize.x,rawSize.y,rawSize.z),target=size.y*.5355,worldScale=target/Math.max(axis,.001);
 if(rightHand){
   const hs=new THREE.Vector3();rightHand.getWorldScale(hs);
   const axeGripBone=new THREE.Object3D();axeGripBone.name="KB_AxeGrip";rightHand.add(axeGripBone);
   axeGripBone.position.set(0,0,0);axeGripBone.rotation.set(0,0,0);axeGripBone.add(axe3D);
   axe3D.scale.set(worldScale/Math.max(hs.x,.001),worldScale/Math.max(hs.y,.001),worldScale/Math.max(hs.z,.001));
   axe3D.rotation.set(0,-Math.PI/2,0);axe3D.position.set(0,0,0);axeGripBone.updateMatrixWorld(true);
   // Calibrate the TWO models together: derive palm center from Warrior hand geometry and shaft center from Axe geometry.
   axeGripBone.updateMatrixWorld(true);axe3D.updateMatrixWorld(true);
   // Find the actual SHAFT mesh/node inside Axe.glb. Do NOT derive grip from the whole-axe bounding box.
   const shaftCandidates=[];
   axe3D.traverse(n=>{if(n.isMesh){
     const nm=(n.name||"").toLowerCase();
     const g=n.geometry;if(!g)return;
     if(!g.boundingBox)g.computeBoundingBox();
     const bb=g.boundingBox,sz=bb.getSize(new THREE.Vector3());
     // Prefer explicit Meshy names; otherwise identify the long narrow handle geometry.
     const named=/shaft|handle|haft|wood|grip/.test(nm);
     const slender=sz.y>Math.max(sz.x,sz.z)*2.2;
     if(named||slender)shaftCandidates.push({n,named,ratio:sz.y/Math.max(sz.x,sz.z,.0001),vol:sz.x*sz.y*sz.z});
   }});
   shaftCandidates.sort((a,b)=>(b.named-a.named)||(b.ratio-a.ratio)||(b.vol-a.vol));
   const shaft=shaftCandidates[0]?.n||null;
   let shaftGripWorld;
   if(shaft&&shaft.geometry){
     if(!shaft.geometry.boundingBox)shaft.geometry.computeBoundingBox();
     // Center of the SHAFT MESH itself (local geometry center), transformed into world space.
     const shaftCenterLocal=shaft.geometry.boundingBox.getCenter(new THREE.Vector3());
     shaftGripWorld=shaft.localToWorld(shaftCenterLocal.clone());
     console.info("KB Axe shaft detected:",shaft.name||"(unnamed mesh)","grip center:",shaftGripWorld.toArray());
   }else{
     // Safe fallback only if the GLB exposes no identifiable shaft mesh.
     const axeOriginWorld=new THREE.Vector3();axe3D.getWorldPosition(axeOriginWorld);shaftGripWorld=axeOriginWorld;
     console.warn("KB Axe shaft mesh not detected; using axe origin fallback");
   }
   // Mixamo RightHand origin is wrist-biased. Offset the anchor into the closed fist/palm center.
   const palmOffsetWorld=size.y*.035;
   const handQuat=rightHand.getWorldQuaternion(new THREE.Quaternion());
   const palmDirWorld=new THREE.Vector3(1,0,0).applyQuaternion(handQuat).normalize();
   const palmCenterWorld=new THREE.Vector3();rightHand.getWorldPosition(palmCenterWorld);palmCenterWorld.addScaledVector(palmDirWorld,palmOffsetWorld);
   // Move Axe so its internal shaft center coincides exactly with Warrior palm center.
   const deltaWorld=palmCenterWorld.clone().sub(shaftGripWorld);
   const parentQuat=axeGripBone.getWorldQuaternion(new THREE.Quaternion());
   const parentScale=new THREE.Vector3();axeGripBone.getWorldScale(parentScale);
   const deltaLocal=deltaWorld.clone().applyQuaternion(parentQuat.clone().invert());
   deltaLocal.set(deltaLocal.x/Math.max(parentScale.x,.001),deltaLocal.y/Math.max(parentScale.y,.001),deltaLocal.z/Math.max(parentScale.z,.001));
   axe3D.position.add(deltaLocal);
   // User-defined axe UP = shaft direction toward the axe head (red-arrow direction).
   // Move the whole axe upward by half of its own full length while preserving the grip/bone hierarchy.
   axe3D.updateMatrixWorld(true);
   const axeAllBox=new THREE.Box3().setFromObject(axe3D),axeAllSize=axeAllBox.getSize(new THREE.Vector3());
   const axeUpWorld=new THREE.Vector3(0,1,0).applyQuaternion(axe3D.getWorldQuaternion(new THREE.Quaternion())).normalize();
   const axeUpLocal=axeUpWorld.clone().applyQuaternion(axeGripBone.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
   axe3D.position.add(axeUpLocal.multiplyScalar((axeAllSize.y*.5)/Math.max(parentScale.y,.001)));
   // V83 calibration: whole axe length = 1 unit.
   // Down = -0.25 unit along the defined axe-up axis.
   axe3D.position.add(axeUpLocal.clone().multiplyScalar((-axeAllSize.y*.25)/Math.max(parentScale.y,.001)));
   // User-defined FRONT is the image arrow direction. Move BACK by 0.10 unit.
   const axeForwardWorld=new THREE.Vector3(-1,0,0).applyQuaternion(axe3D.getWorldQuaternion(new THREE.Quaternion())).normalize();
   const axeForwardLocal=axeForwardWorld.clone().applyQuaternion(axeGripBone.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
   axe3D.position.add(axeForwardLocal.multiplyScalar((axeAllSize.y*.10)/Math.max(parentScale.x,.001)));
   axeGripBone.updateMatrixWorld(true);
   window.KB_AXE_GRIP=axeGripBone;
 }else{
   axe3D.scale.setScalar(worldScale);warrior3D.add(axe3D);axe3D.rotation.set(0,-Math.PI/2,0);axe3D.position.set(.3*size.x,.48*size.y,.08*size.z);
 }
 axe3D.visible=true;axe3D.traverse(n=>{n.visible=true;if(n.isMesh)n.frustumCulled=false});
})
 },undefined,e=>console.error("KB warrior load failed",e));
 function loop(){requestAnimationFrame(loop);if(document.hidden)return;if(warriorMixer)warriorMixer.update(Math.min(warriorClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function setupArcher3D(){
 const host=document.querySelector("#archer3d");if(!host||host.dataset.three)return;host.dataset.three="1";host.innerHTML="";host.classList.add("archer3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true}),loader=new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));ren.outputColorSpace=THREE.SRGBColorSpace;ren.setClearColor(0x000000,0);ren.domElement.style.cssText="display:block;width:100%;height:100%;position:absolute;inset:0;z-index:5";host.style.position="relative";host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 loader.load("./Archer_512.glb",g=>{archer3D=g.scene;scene.add(archer3D);const raw=new THREE.Box3().setFromObject(archer3D),rs=raw.getSize(new THREE.Vector3()),rc=raw.getCenter(new THREE.Vector3());
 archer3D.position.set(-rc.x,-raw.min.y,-rc.z);archer3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9-Math.PI/4;archer3D.scale.setScalar(4.158/Math.max(rs.y,.001));
 const fit=new THREE.Box3().setFromObject(archer3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());archer3D.position.x-=center.x;archer3D.position.y-=fit.min.y;
 const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(size.y*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,size.y*.5,dist);cam.lookAt(0,size.y*.5,0);
 archerMixer=new THREE.AnimationMixer(archer3D);const clips=g.animations||[];window.KB_ARCHER_ANIMATIONS=clips.map((a,i)=>({index:i+1,name:a.name,duration:a.duration}));console.table(window.KB_ARCHER_ANIMATIONS);
 const norm=s=>(s||"").replace(/[ _-]/g,"").toLowerCase();archerIdle=clips.find(a=>norm(a.name)==="archeryshot2")||null;archerAttack=clips.find(a=>norm(a.name)==="archeryshot3")||null;
 // Correct right-hand penetration for both Archery Shot 2 and 3 at skeleton level.
 const archerBones=[];archer3D.traverse(o=>{if(o.isBone)archerBones.push(o)});
 const archerRightHand=archerBones.find(o=>/(mixamorigRightHand|right.*hand|hand.*r|r[_ .-]?hand)/i.test(o.name))||null;
 if(archerRightHand){
   const fistDistance=size.y*.045*(-12.5);
   const faceForwardWorld=new THREE.Vector3(0,0,1).applyQuaternion(archer3D.getWorldQuaternion(new THREE.Quaternion())).normalize();
   const parent=archerRightHand.parent;
   const parentQuat=parent.getWorldQuaternion(new THREE.Quaternion());
   const parentScale=new THREE.Vector3();parent.getWorldScale(parentScale);
   const localMove=faceForwardWorld.clone().applyQuaternion(parentQuat.clone().invert());
   localMove.set(localMove.x*fistDistance/Math.max(parentScale.x,.001),localMove.y*fistDistance/Math.max(parentScale.y,.001),localMove.z*fistDistance/Math.max(parentScale.z,.001));
   const basePos=archerRightHand.position.clone();
   archerMixer.addEventListener("loop",()=>{});
   const originalUpdate=archerMixer.update.bind(archerMixer);
   archerMixer.update=(dt)=>{originalUpdate(dt);archerRightHand.position.copy(basePos).add(localMove);archerRightHand.updateMatrixWorld(true)};
   console.info("KB Archer right hand correction: 12.5 fists in defined positive direction",localMove.toArray());
 }
 if(archerIdle)archerMixer.clipAction(archerIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();archerReady=true;
 },undefined,e=>console.error("KB archer load failed",e));
 function loop(){requestAnimationFrame(loop);if(document.hidden)return;if(archerMixer)archerMixer.update(Math.min(archerClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function playArcherAttack(){
 if(!archerReady||!archerMixer||!archerAttack)return;if(archerAttacking){archerAttackQueued=true;return}archerAttacking=true;
 const p=archer3D.position.clone(),q=archer3D.quaternion.clone(),idle=archerIdle?archerMixer.clipAction(archerIdle):null,atk=archerMixer.clipAction(archerAttack);
 atk.reset().setLoop(THREE.LoopOnce,1);atk.clampWhenFinished=true;if(idle)idle.crossFadeTo(atk,.10,false);atk.play();
 const done=e=>{if(e.action!==atk)return;archerMixer.removeEventListener("finished",done);archer3D.position.copy(p);archer3D.quaternion.copy(q);archerAttacking=false;
  if(archerAttackQueued){archerAttackQueued=false;atk.stop();playArcherAttack();return}
  if(idle){atk.crossFadeTo(idle,.10,false);idle.reset().setLoop(THREE.LoopRepeat,Infinity).play()}else atk.stop();
 };archerMixer.addEventListener("finished",done);
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
function draw(){B.innerHTML="";G.forEach((t,i)=>{let b=document.createElement("button");b.type="button";b.className="tile"+(i===Q?" selected":"");b.dataset.i=i;let im=document.createElement("img");setIconInstant(im,icon(t,U[t].l));im.alt=names[t];b.appendChild(im);B.appendChild(b)});$("#totalDamage").textContent=total;$("#bestDamage").textContent=best;if(!$("#units").children.length){$("#units").innerHTML=U.map((u,i)=>'<div class="unit"><div class="icon"'+(i===0?' id="swordsman3d"':i===1?' id="archer3d"':i===3?' id="warrior3d"':'')+'>'+((i===0||i===1||i===3)?'':'<img data-unit="'+i+'" src="'+icon(i,u.l)+'">')+'</div></div>').join("");setupSwordsman3D();setupArcher3D();setupWarrior3D()}else{U.forEach((u,i)=>{if(i===0||i===1||i===3)return;let im=document.querySelector('#units img[data-unit="'+i+'"]');if(im)setIconInstant(im,icon(i,u.l))})}}function find(){let z=new Set(),a=[];for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c<N&&G[id(r,c)]===G[id(r,s)])continue;if(c-s>=3){let q=[];for(let k=s;k<c;k++){z.add(id(r,k));q.push(id(r,k))}a.push(q)}s=c}}for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r<N&&G[id(r,c)]===G[id(s,c)])continue;if(r-s>=3){let q=[];for(let k=s;k<r;k++){z.add(id(k,c));q.push(id(k,c))}a.push(q)}s=r}}return{ids:[...z],groups:a}}function pop(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}function reward(m,ch){let p=0,C=[0,0,0,0];m.groups.forEach(g=>p+=g.length>=5?10:g.length===4?3:1);p*=ch;m.ids.forEach(i=>C[G[i]]++);C.forEach((n,t)=>{if(!n)return;if(t===0)playSwordAttack();if(t===1)playArcherAttack();if(t===3)playWarriorAttack();U[t].x+=n;while(U[t].l<4&&U[t].x>=need(U[t].l)){U[t].x-=need(U[t].l);U[t].l++}});let d=0;C.forEach((n,t)=>d+=n*(4+U[t].l*3));d=Math.round(d*ch);total+=d;best=Math.max(best,d);$("#scorePop").textContent="+"+p+(ch>1?" COMBO ×"+ch:"");pop($("#scorePop"),"go");$("#damage").textContent="-"+d;pop($("#damage"),"go");draw()}function fall(ids){let x=new Set(ids);for(let c=0;c<N;c++){let k=[];for(let r=N-1;r>=0;r--)if(!x.has(id(r,c)))k.push(G[id(r,c)]);for(let r=N-1,n=0;r>=0;r--,n++)G[id(r,c)]=n<k.length?k[n]:rnd()}}async function resolve(){let ch=1;while(1){let m=find();if(!m.ids.length)break;reward(m,ch);m.ids.forEach(i=>B.children[i]&&B.children[i].classList.add("kill"));await wait(420);fall(m.ids);draw();await wait(130);ch++}}function end(){}async function swap(a,b){if(busy||!near(a,b))return;busy=1;B.children[a]?.classList.add("swap");B.children[b]?.classList.add("swap");await wait(250);[G[a],G[b]]=[G[b],G[a]];draw();await wait(80);if(!find().ids.length){[G[a],G[b]]=[G[b],G[a]];draw();$("#hint").textContent="该交换没有形成三消。";busy=0;return}await resolve();draw();busy=0}function choose(i){if(busy)return;if(Q<0){Q=i;draw()}else if(Q===i){Q=-1;draw()}else if(near(Q,i)){let a=Q;Q=-1;swap(a,i)}else{Q=i;draw()}}function reset(){total=0;best=0;Q=-1;busy=0;U=Array.from({length:4},()=>({l:1,x:0}));$("#hint").textContent="拖动图标，或点击两个相邻图标交换。";make();draw()}preloadIcons();B.addEventListener("click",e=>{let t=e.target.closest(".tile");if(t)choose(+t.dataset.i)});let startX=0,startY=0;
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