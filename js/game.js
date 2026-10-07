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
}function make(){G=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){let t=rnd();while((c>1&&G[id(r,c-1)]===t&&G[id(r,c-2)]===t)||(r>1&&G[id(r-1,c)]===t&&G[id(r-2,c)]===t))t=rnd();G.push(t)}}function setupHeadDebug(){
 if(document.querySelector("#headBoneDebug"))return;
 const state={actor:"swordsman",x:0,y:0,z:0,rx:0,ry:0,rz:0};window.KB_HEAD_DEBUG=state;
 const p=document.createElement("div");p.id="headBoneDebug";p.innerHTML='<b>HEAD / NECK DEBUG</b><label>Actor <select id="hdActor"><option value="swordsman" selected>Swordsman</option><option value="warrior">Warrior</option></select></label><label>Bone <select id="hdBone"><option value="head">Head</option><option value="neck">Neck</option></select></label>'+["x","y","z"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-1" max="1" step=".005" value="0"><output>0</output></label>').join("")+["rx","ry","rz"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-180" max="180" step="1" value="0"><output>0</output></label>').join("")+'<div><button id="hdReset">Reset</button><button id="hdCopy">Copy Values</button></div><pre id="hdOut"></pre>';document.body.appendChild(p);
 const zero=()=>{["x","y","z","rx","ry","rz"].forEach(k=>state[k]=0);p.querySelectorAll("input").forEach(i=>{i.value=0;i.nextElementSibling.value="0"})};
 p.querySelector("#hdActor").onchange=e=>{state.actor=e.target.value;zero()};p.querySelector("#hdBone").onchange=()=>zero();
 p.querySelectorAll("input").forEach(i=>i.oninput=()=>{state[i.dataset.k]=+i.value;i.nextElementSibling.value=i.value});
 p.querySelector("#hdReset").onclick=zero;p.querySelector("#hdCopy").onclick=()=>{const txt=(state.actor==="swordsman"?"Swordsman":"Warrior")+" "+p.querySelector("#hdBone").value+" "+JSON.stringify(state);p.querySelector("#hdOut").textContent=txt;navigator.clipboard?.writeText(txt)};
 window.KB_APPLY_HEAD_DEBUG=(root,mixer,actor)=>{const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o)});const head=bones.find(o=>/(mixamorigHead|^head$|head)/i.test(o.name)),neck=bones.find(o=>/(mixamorigNeck|^neck$|neck)/i.test(o.name)),base=mixer.update.bind(mixer);mixer.update=(dt)=>{base(dt);if(actor==="warrior"&&head){head.rotation.x+=THREE.MathUtils.degToRad(-21);head.rotation.y+=THREE.MathUtils.degToRad(1)}if(actor==="swordsman"&&head){
 // Suppress the large nodding authored into Combat Stance while idle.
 // Capture a stable head basis once, then hold the calibrated look direction.
 const isAttacking=typeof swordAttacking!=="undefined"&&swordAttacking;
 if(!isAttacking){
   if(!head.userData.kbIdleBaseQ)head.userData.kbIdleBaseQ=head.quaternion.clone();
   const fixedOffset=new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(-21),THREE.MathUtils.degToRad(24),0,"XYZ"));
   const targetQ=head.userData.kbIdleBaseQ.clone().multiply(fixedOffset);
   const prev=head.userData.kbStableHeadQ||targetQ.clone();
   prev.slerp(targetQ,1-Math.exp(-dt*22));head.userData.kbStableHeadQ=prev;head.quaternion.copy(prev);
 }else{
   head.userData.kbIdleBaseQ=null;head.userData.kbStableHeadQ=null;
 }
}if(state.actor!==actor)return;const bone=document.querySelector("#hdBone")?.value==="neck"?(neck||head):(head||neck);if(!bone)return;bone.position.x+=state.x;bone.position.y+=state.y;bone.position.z+=state.z;bone.rotation.x+=THREE.MathUtils.degToRad(state.rx);bone.rotation.y+=THREE.MathUtils.degToRad(state.ry);bone.rotation.z+=THREE.MathUtils.degToRad(state.rz);bone.updateMatrixWorld(true)}};
}
function setupSwordsman3D(){
 const host=document.querySelector("#swordsman3d");if(!host||host.dataset.three)return;
 host.dataset.three="1";host.innerHTML="";host.classList.add("swordsman3d");
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true});const makeLoader=()=>new GLTFLoader();
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));ren.outputColorSpace=THREE.SRGBColorSpace;ren.setClearColor(0x000000,0);ren.domElement.style.cssText="display:block;width:100%;height:100%;position:absolute;inset:0;z-index:5";host.style.position="relative";host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 makeLoader().load("./swordsman_512.glb",g=>{
  sword3D=g.scene;scene.add(sword3D);
  const raw=new THREE.Box3().setFromObject(sword3D),rawSize=raw.getSize(new THREE.Vector3()),rawCenter=raw.getCenter(new THREE.Vector3());
  sword3D.position.set(-rawCenter.x,-raw.min.y,-rawCenter.z);sword3D.rotation.y=Math.PI/4+Math.PI/6+Math.PI/9;sword3D.scale.setScalar((4.158*1.11288375)/Math.max(rawSize.y,.001));
  const fit=new THREE.Box3().setFromObject(sword3D),size=fit.getSize(new THREE.Vector3()),center=fit.getCenter(new THREE.Vector3());
  sword3D.position.x-=center.x;sword3D.position.y-=fit.min.y;
  // IMPORTANT: camera framing must stay tied to the original baseline size.
  // Previously it used the post-scale size, so every model enlargement moved the camera back by the same ratio and visually cancelled the scale change.
  const baselineHeight=size.y/1.11288375;
  const vfov=THREE.MathUtils.degToRad(cam.fov),dist=(baselineHeight*.72)/Math.tan(vfov/2);cam.position.set(dist*.72,baselineHeight*.5,dist);cam.lookAt(0,baselineHeight*.5,0);
  swordMixer=new THREE.AnimationMixer(sword3D);setupHeadDebug();window.KB_APPLY_HEAD_DEBUG(sword3D,swordMixer,"swordsman");const clips=g.animations||[],idleClips=clips.filter(a=>/idle/i.test(a.name));
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
 warriorMixer=new THREE.AnimationMixer(warrior3D);setupHeadDebug();window.KB_APPLY_HEAD_DEBUG(warrior3D,warriorMixer,"warrior");const clips=g.animations||[];window.KB_WARRIOR_ANIMATIONS=clips.map((a,i)=>({index:i+1,name:a.name,duration:a.duration}));console.table(window.KB_WARRIOR_ANIMATIONS);warriorIdle=clips.find(a=>a.name==="Idle_5")||clips.find(a=>a.name.replace(/[ _-]/g,"").toLowerCase()==="idle5")||null;console.info("KB Warrior animations:",clips.map(a=>a.name),"selected idle:",warriorIdle?.name);warriorAttack=clips.find(a=>a.name==="Axe_Spin_Attack")||clips.find(a=>/attack/i.test(a.name))||null;
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
function setupBowDebug(bow){
 if(document.querySelector("#bowDebug"))return;
 const d={x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1};window.KB_BOW_DEBUG=d;
 const basePos=bow.position.clone(),baseRot=bow.rotation.clone(),baseScale=bow.scale.clone();
 const p=document.createElement("div");p.id="bowDebug";p.innerHTML='<b>ARCHER BOW DEBUG</b>'+["x","y","z"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-2" max="2" step=".01" value="0"><output>0</output></label>').join("")+["rx","ry","rz"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-180" max="180" step="1" value="0"><output>0</output></label>').join("")+'<label>Scale <input data-k="scale" type="range" min=".2" max="3" step=".05" value="1"><output>1</output></label><div><button id="bowReset">Reset</button><button id="bowCopy">Copy Values</button></div><pre id="bowOut"></pre>';document.body.appendChild(p);
 const apply=()=>{bow.position.set(basePos.x+d.x,basePos.y+d.y,basePos.z+d.z);bow.rotation.set(baseRot.x+THREE.MathUtils.degToRad(d.rx),baseRot.y+THREE.MathUtils.degToRad(d.ry),baseRot.z+THREE.MathUtils.degToRad(d.rz));bow.scale.copy(baseScale).multiplyScalar(d.scale)};
 p.querySelectorAll("input").forEach(i=>i.oninput=()=>{d[i.dataset.k]=+i.value;i.nextElementSibling.value=i.value;apply()});
 p.querySelector("#bowReset").onclick=()=>{Object.assign(d,{x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1});p.querySelectorAll("input").forEach(i=>{i.value=i.dataset.k==="scale"?1:0;i.nextElementSibling.value=i.value});apply()};
 p.querySelector("#bowCopy").onclick=()=>{const txt="Archer Bow "+JSON.stringify(d);p.querySelector("#bowOut").textContent=txt;navigator.clipboard?.writeText(txt)};
}
function setupArrowDebug(arrow){
 if(document.querySelector("#arrowDebug"))return;
 const d={x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1};window.KB_ARROW_DEBUG=d;
 const basePos=arrow.position.clone(),baseRot=arrow.rotation.clone(),baseScale=arrow.scale.clone();
 const p=document.createElement("div");p.id="arrowDebug";p.innerHTML='<b>ARCHER ARROW DEBUG</b>'+["x","y","z"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-2" max="2" step=".01" value="0"><output>0</output></label>').join("")+["rx","ry","rz"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-180" max="180" step="1" value="0"><output>0</output></label>').join("")+'<label>Scale <input data-k="scale" type="range" min=".2" max="3" step=".05" value="1"><output>1</output></label><div><button id="arrowReset">Reset</button><button id="arrowCopy">Copy Values</button></div><pre id="arrowOut"></pre>';document.body.appendChild(p);
 const apply=()=>{arrow.position.set(basePos.x+d.x,basePos.y+d.y,basePos.z+d.z);arrow.rotation.set(baseRot.x+THREE.MathUtils.degToRad(d.rx),baseRot.y+THREE.MathUtils.degToRad(d.ry),baseRot.z+THREE.MathUtils.degToRad(d.rz));arrow.scale.copy(baseScale).multiplyScalar(d.scale)};
 p.querySelectorAll("input").forEach(i=>i.oninput=()=>{d[i.dataset.k]=+i.value;i.nextElementSibling.value=i.value;apply()});
 p.querySelector("#arrowReset").onclick=()=>{Object.assign(d,{x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1});p.querySelectorAll("input").forEach(i=>{i.value=i.dataset.k==="scale"?1:0;i.nextElementSibling.value=i.value});apply()};
 p.querySelector("#arrowCopy").onclick=()=>{const txt="Archer Arrow "+JSON.stringify(d);p.querySelector("#arrowOut").textContent=txt;navigator.clipboard?.writeText(txt)};
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
 // V105 manual Archer RightHand debug controller.
 const archerBones=[];archer3D.traverse(o=>{if(o.isBone)archerBones.push(o)});
 const archerRightShoulder=archerBones.find(o=>/(mixamorigRightShoulder|right.*shoulder|shoulder.*r)/i.test(o.name))||null;
 const archerRightElbow=archerBones.find(o=>/(mixamorigRightForeArm|right.*forearm|right.*lowerarm|forearm.*r|lowerarm.*r)/i.test(o.name))||null;
 const archerHead=archerBones.find(o=>/(mixamorigHead|^head$|head)/i.test(o.name))||null;
 const archerLeftHand=archerBones.find(o=>/(mixamorigLeftHand|left.*hand|hand.*l|l[_ .-]?hand)/i.test(o.name))||null;
 const archerRightHand=archerBones.find(o=>/(mixamorigRightHand|right.*hand|hand.*r|r[_ .-]?hand)/i.test(o.name))||null;
 loader.load("./Arrow_256.glb",ag=>{const arrow=ag.scene;const bb=new THREE.Box3().setFromObject(arrow),bs=bb.getSize(new THREE.Vector3()),axis=Math.max(bs.x,bs.y,bs.z),target=size.y*.42,desired=target/Math.max(axis,.001);
   if(archerRightHand){const hs=new THREE.Vector3();archerRightHand.getWorldScale(hs);arrow.scale.set((desired*1.25)/Math.max(hs.x,.001),(desired*1.25)/Math.max(hs.y,.001),(desired*1.25)/Math.max(hs.z,.001));archerRightHand.add(arrow);arrow.position.set(-0.1,0.37,0.12);arrow.rotation.set(THREE.MathUtils.degToRad(101),0,0)}
   else{arrow.scale.setScalar(desired);archer3D.add(arrow);arrow.position.set(.25*size.x,.5*size.y,0)}
   arrow.traverse(n=>{if(n.isMesh)n.frustumCulled=false});window.KB_ARCHER_ARROW=arrow;window.KB_ARCHER_ARROW_HAND=archerRightHand;window.KB_ARCHER_ARROW_BASE={position:arrow.position.clone(),quaternion:arrow.quaternion.clone(),scale:arrow.scale.clone()};setupArrowDebug(arrow);
 },undefined,e=>console.error("KB arrow load failed",e));
 loader.load("./Bow_256.glb",bg=>{const bow=bg.scene;const bb=new THREE.Box3().setFromObject(bow),bs=bb.getSize(new THREE.Vector3()),axis=Math.max(bs.x,bs.y,bs.z),target=size.y*.48,desired=target/Math.max(axis,.001);
   if(archerLeftHand){const hs=new THREE.Vector3();archerLeftHand.getWorldScale(hs);bow.scale.set((desired*1.2)/Math.max(hs.x,.001),(desired*1.2)/Math.max(hs.y,.001),(desired*1.2)/Math.max(hs.z,.001));archerLeftHand.add(bow);bow.position.set(0,0,0);bow.rotation.set(THREE.MathUtils.degToRad(101),THREE.MathUtils.degToRad(61),THREE.MathUtils.degToRad(-1))}
   else{bow.scale.setScalar(desired);archer3D.add(bow);bow.position.set(-.25*size.x,.5*size.y,0)}
   bow.traverse(n=>{if(n.isMesh)n.frustumCulled=false});window.KB_ARCHER_BOW=bow;setupBowDebug(bow);
 },undefined,e=>console.error("KB bow load failed",e));
 const archerBaseUpdate=archerMixer.update.bind(archerMixer);
 archerMixer.update=(dt)=>{archerBaseUpdate(dt);if(archerRightShoulder)archerRightShoulder.rotation.x+=THREE.MathUtils.degToRad(39);if(archerRightElbow)archerRightElbow.rotation.x+=THREE.MathUtils.degToRad(-9);if(archerHead){archerHead.rotation.x+=THREE.MathUtils.degToRad(-21);archerHead.rotation.y+=THREE.MathUtils.degToRad(30)}};
 if(archerIdle)archerMixer.clipAction(archerIdle).reset().setLoop(THREE.LoopRepeat,Infinity).play();archerReady=true;
 },undefined,e=>console.error("KB archer load failed",e));
 function loop(){requestAnimationFrame(loop);if(document.hidden)return;if(archerMixer)archerMixer.update(Math.min(archerClock.getDelta(),.05));ren.render(scene,cam)}loop();
}
function playArcherAttack(){
 if(!archerReady||!archerMixer||!archerAttack)return;if(archerAttacking){archerAttackQueued=true;return}archerAttacking=true;
 const p=archer3D.position.clone(),q=archer3D.quaternion.clone(),idle=archerIdle?archerMixer.clipAction(archerIdle):null,atk=archerMixer.clipAction(archerAttack);
 const arrow=window.KB_ARCHER_ARROW,hand=window.KB_ARCHER_ARROW_HAND,base=window.KB_ARCHER_ARROW_BASE;
 let shotRAF=0,shotStart=0;
 const shoot=()=>{
  if(!arrow||!hand||!arrow.parent)return;
  // Reuse the exact same Arrow object: detach while preserving world transform; no clone, geometry, material, texture, or new GLB allocation.
  const sceneRoot=archer3D.parent;sceneRoot.attach(arrow);arrow.visible=true;
  const from=new THREE.Vector3();arrow.getWorldPosition(from);
  // Boss is visually to the right of the actor viewport; fly along screen/world right far enough to reach it.
  const to=from.clone().add(new THREE.Vector3(6,0,0));
  shotStart=performance.now();
  const fly=now=>{const t=Math.min(1,(now-shotStart)/260),e=1-Math.pow(1-t,3);arrow.position.lerpVectors(from,to,e);
   if(t<1)shotRAF=requestAnimationFrame(fly);else{arrow.visible=false;shotRAF=0}
  };shotRAF=requestAnimationFrame(fly);
 };
 // Fire shortly after Archery Shot 3 begins so release reads as part of the attack.
 setTimeout(shoot,Math.min(180,Math.max(70,archerAttack.duration*1000*.22)));
 atk.reset().setLoop(THREE.LoopOnce,1);atk.clampWhenFinished=true;if(idle)idle.crossFadeTo(atk,.10,false);atk.play();
 const done=e=>{if(e.action!==atk)return;archerMixer.removeEventListener("finished",done);if(shotRAF)cancelAnimationFrame(shotRAF);
  // Return the SAME hidden arrow to RightHand for idle; no disposed/hidden projectile remains in scene.
  if(arrow&&hand&&base){hand.add(arrow);arrow.position.copy(base.position);arrow.quaternion.copy(base.quaternion);arrow.scale.copy(base.scale);arrow.visible=true}
  archer3D.position.copy(p);archer3D.quaternion.copy(q);archerAttacking=false;
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
function setupHorse3D(){
 const host=document.querySelector("#horse3d");if(!host||host.dataset.three)return;host.dataset.three="1";host.innerHTML="";
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,209/180,.1,100),ren=new THREE.WebGLRenderer({alpha:true,antialias:true}),loader=new GLTFLoader(),clock=new THREE.Clock();let knightMixer=null;
 ren.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));ren.outputColorSpace=THREE.SRGBColorSpace;ren.setClearColor(0,0);ren.domElement.style.cssText="display:block;width:100%;height:100%;position:absolute;inset:0";host.style.position="relative";host.appendChild(ren.domElement);
 const resize=()=>{const w=Math.max(host.clientWidth,209),h=Math.max(host.clientHeight,180);cam.aspect=w/h;cam.updateProjectionMatrix();ren.setSize(w,h,false)};resize();window.addEventListener("resize",resize);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a4630,2.5));const dl=new THREE.DirectionalLight(0xffffff,3);dl.position.set(-3,5,4);scene.add(dl);
 loader.load("./Horse_256.glb",g=>{const horse=g.scene;scene.add(horse);const raw=new THREE.Box3().setFromObject(horse),rs=raw.getSize(new THREE.Vector3()),rc=raw.getCenter(new THREE.Vector3());horse.position.set(-rc.x,-raw.min.y,-rc.z);horse.rotation.y=THREE.MathUtils.degToRad(112);horse.scale.setScalar(3.6/Math.max(rs.y,.001));
  const fit=new THREE.Box3().setFromObject(horse),sz=fit.getSize(new THREE.Vector3()),ct=fit.getCenter(new THREE.Vector3());horse.position.x-=ct.x;horse.position.y-=fit.min.y;const vf=THREE.MathUtils.degToRad(cam.fov),dist=(sz.y*.8)/Math.tan(vf/2);cam.position.set(dist*.75,sz.y*.5,dist);cam.lookAt(0,sz.y*.5,0);
  loader.load("./Knight_512.glb",kg=>{const knight=kg.scene;horse.add(knight);const kb=new THREE.Box3().setFromObject(knight),ks=kb.getSize(new THREE.Vector3()),kc=kb.getCenter(new THREE.Vector3());knight.scale.setScalar((sz.y*.72)/Math.max(ks.y,.001));knight.position.set(-kc.x-0.06,sz.y*.58-2.36,-kc.z-0.3);knight.rotation.set(0,0,0);knight.scale.multiplyScalar(1.8);
   knightMixer=new THREE.AnimationMixer(knight);const clips=kg.animations||[];window.KB_KNIGHT_ANIMATIONS=clips.map((a,i)=>({index:i,name:a.name,duration:a.duration}));console.table(window.KB_KNIGHT_ANIMATIONS);
   const ride=clips.find(a=>a.name==="01a11651-1a6a-7697-9066-bf9090227d00")||clips[2]||clips[0];if(ride){const rideAction=knightMixer.clipAction(ride);rideAction.reset().enabled=true;rideAction.setLoop(THREE.LoopRepeat,Infinity);rideAction.clampWhenFinished=false;rideAction.play();}
   const bones=[];knight.traverse(o=>{if(o.isBone)bones.push(o)});
   window.KB_KNIGHT_BONES=bones.map((b,i)=>({index:i,name:b.name}));
   const bd={boneIndex:0,rx:0,ry:0,rz:0};window.KB_KNIGHT_BONE_DEBUG=bd;
   const p=document.createElement("div");p.id="knightBoneDebug";
   const opts=bones.map((b,i)=>'<option value="'+i+'">'+i+' · '+(b.name||"(unnamed)")+'</option>').join("");
   p.innerHTML='<b>KNIGHT BONE DEBUG</b><label>Bone <select id="kbBone">'+opts+'</select></label>'+["rx","ry","rz"].map(k=>'<label>'+k.toUpperCase()+' <input data-k="'+k+'" type="range" min="-180" max="180" step="1" value="0"><output>0</output></label>').join("")+'<div><button id="kbReset">Reset</button><button id="kbCopy">Copy Values</button></div><pre id="kbOut"></pre>';document.body.appendChild(p);
   const zero=()=>{bd.rx=bd.ry=bd.rz=0;p.querySelectorAll("input").forEach(i=>{i.value=0;i.nextElementSibling.value="0"})};
   p.querySelector("#kbBone").onchange=e=>{bd.boneIndex=+e.target.value;zero()};
   p.querySelectorAll("input").forEach(i=>i.oninput=()=>{bd[i.dataset.k]=+i.value;i.nextElementSibling.value=i.value});
   p.querySelector("#kbReset").onclick=zero;
   p.querySelector("#kbCopy").onclick=()=>{const b=bones[bd.boneIndex],txt="Knight Bone "+JSON.stringify({index:bd.boneIndex,name:b?.name||"",rx:bd.rx,ry:bd.ry,rz:bd.rz});p.querySelector("#kbOut").textContent=txt;navigator.clipboard?.writeText(txt)};
   const baseUpdate=knightMixer.update.bind(knightMixer);
   knightMixer.update=dt=>{baseUpdate(dt);const hips=bones.find(b=>b.name==="mixamorigHips");if(hips)hips.rotation.x+=THREE.MathUtils.degToRad(26);const b=bones[bd.boneIndex];if(b){b.rotation.x+=THREE.MathUtils.degToRad(bd.rx);b.rotation.y+=THREE.MathUtils.degToRad(bd.ry);b.rotation.z+=THREE.MathUtils.degToRad(bd.rz);b.updateMatrixWorld(true)}};
  },undefined,e=>console.error("KB knight load failed",e));
 },undefined,e=>console.error("KB horse load failed",e));
 (function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(knightMixer)knightMixer.update(dt);ren.render(scene,cam)})();
}
function draw(){B.innerHTML="";G.forEach((t,i)=>{let b=document.createElement("button");b.type="button";b.className="tile"+(i===Q?" selected":"");b.dataset.i=i;let im=document.createElement("img");setIconInstant(im,icon(t,U[t].l));im.alt=names[t];b.appendChild(im);B.appendChild(b)});$("#totalDamage").textContent=total;$("#bestDamage").textContent=best;if(!$("#units").children.length){$("#units").innerHTML=U.map((u,i)=>'<div class="unit"><div class="icon"'+(i===0?' id="swordsman3d"':i===1?' id="archer3d"':i===2?' id="horse3d"':i===3?' id="warrior3d"':'')+'>'+((i===0||i===1||i===2||i===3)?'':'<img data-unit="'+i+'" src="'+icon(i,u.l)+'">')+'</div></div>').join("");setupSwordsman3D();setupArcher3D();setupHorse3D();setupWarrior3D()}else{U.forEach((u,i)=>{if(i===0||i===1||i===2||i===3)return;let im=document.querySelector('#units img[data-unit="'+i+'"]');if(im)setIconInstant(im,icon(i,u.l))})}}function find(){let z=new Set(),a=[];for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c<N&&G[id(r,c)]===G[id(r,s)])continue;if(c-s>=3){let q=[];for(let k=s;k<c;k++){z.add(id(r,k));q.push(id(r,k))}a.push(q)}s=c}}for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r<N&&G[id(r,c)]===G[id(s,c)])continue;if(r-s>=3){let q=[];for(let k=s;k<r;k++){z.add(id(k,c));q.push(id(k,c))}a.push(q)}s=r}}return{ids:[...z],groups:a}}function pop(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}function reward(m,ch){let p=0,C=[0,0,0,0];m.groups.forEach(g=>p+=g.length>=5?10:g.length===4?3:1);p*=ch;m.ids.forEach(i=>C[G[i]]++);C.forEach((n,t)=>{if(!n)return;if(t===0)playSwordAttack();if(t===1)playArcherAttack();if(t===3)playWarriorAttack();U[t].x+=n;while(U[t].l<4&&U[t].x>=need(U[t].l)){U[t].x-=need(U[t].l);U[t].l++}});let d=0;C.forEach((n,t)=>d+=n*(4+U[t].l*3));d=Math.round(d*ch);total+=d;best=Math.max(best,d);$("#scorePop").textContent="+"+p+(ch>1?" COMBO ×"+ch:"");pop($("#scorePop"),"go");$("#damage").textContent="-"+d;pop($("#damage"),"go");draw()}function fall(ids){let x=new Set(ids);for(let c=0;c<N;c++){let k=[];for(let r=N-1;r>=0;r--)if(!x.has(id(r,c)))k.push(G[id(r,c)]);for(let r=N-1,n=0;r>=0;r--,n++)G[id(r,c)]=n<k.length?k[n]:rnd()}}async function resolve(){let ch=1;while(1){let m=find();if(!m.ids.length)break;reward(m,ch);m.ids.forEach(i=>B.children[i]&&B.children[i].classList.add("kill"));await wait(420);fall(m.ids);draw();await wait(130);ch++}}function end(){}async function swap(a,b){if(busy||!near(a,b))return;busy=1;B.children[a]?.classList.add("swap");B.children[b]?.classList.add("swap");await wait(250);[G[a],G[b]]=[G[b],G[a]];draw();await wait(80);if(!find().ids.length){[G[a],G[b]]=[G[b],G[a]];draw();$("#hint").textContent="该交换没有形成三消。";busy=0;return}await resolve();draw();busy=0}function choose(i){if(busy)return;if(Q<0){Q=i;draw()}else if(Q===i){Q=-1;draw()}else if(near(Q,i)){let a=Q;Q=-1;swap(a,i)}else{Q=i;draw()}}function reset(){total=0;best=0;Q=-1;busy=0;U=Array.from({length:4},()=>({l:1,x:0}));$("#hint").textContent="拖动图标，或点击两个相邻图标交换。";make();draw()}const gridToggle=document.querySelector("#gridToggle");
if(gridToggle){gridToggle.checked=false;document.body.classList.remove("show-grid");gridToggle.addEventListener("change",()=>document.body.classList.toggle("show-grid",gridToggle.checked))}
preloadIcons();B.addEventListener("click",e=>{let t=e.target.closest(".tile");if(t)choose(+t.dataset.i)});let startX=0,startY=0;
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