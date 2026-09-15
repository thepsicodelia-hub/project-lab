import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// The two contours are the original Project Lab SVG, extruded in its 64-unit space.
function logoGeometry(letter) {
  const s = new THREE.Shape();
  if(letter==='P') {
    s.moveTo(10,8); s.lineTo(37,8); s.bezierCurveTo(47.5,8,56,16.5,56,27);
    s.lineTo(56,40);s.lineTo(43,40);s.lineTo(43,27);
    s.absarc(37,27,6,0,-Math.PI/2,true);s.lineTo(23,21);s.lineTo(23,48);s.lineTo(10,48);s.closePath();
  } else {
    s.moveTo(29,29);s.lineTo(42,29);s.lineTo(42,43);s.lineTo(56,43);s.lineTo(56,56);s.lineTo(29,56);s.closePath();
  }
  const geometry=new THREE.ExtrudeGeometry(s,{depth:8.5,steps:1,bevelEnabled:true,bevelSize:.36,bevelThickness:.5,bevelSegments:5,curveSegments:40});
  geometry.translate(-33,-32,-4.25);geometry.scale(1/15,1/15,1/15);geometry.rotateX(Math.PI);
  geometry.computeVertexNormals();
  const points=s.getPoints(80).map(p=>new THREE.Vector3((p.x-33)/15,(32-p.y)/15,.318));
  geometry.userData.contour=points;
  return geometry;
}

const vertex=/* glsl */`
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vLocal;
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorldPosition=world.xyz;
  vNormal=normalize(mat3(modelMatrix)*normal);
  vLocal=position;
  gl_Position=projectionMatrix*viewMatrix*world;
}`;
const fragment=/* glsl */`
precision highp float;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vLocal;
uniform float uTime;
uniform float uPulse;
uniform float uChromatic;
float band(float p,float center,float width){return exp(-pow((p-center)/width,2.0));}
// A virtual optical studio. White strip lights sampled separately through three IORs.
vec3 studio(vec3 ray){
  float angle=atan(ray.x,ray.z);
  float vertical=ray.y;
  float a=angle+vertical*.3;
  float key=band(a,-.75,.065)*2.6;
  float secondary=band(a,1.0,.12)*1.45;
  float ceiling=band(vertical,.75,.08)*.9;
  float softbox=band(a,-1.0,.34)*band(vertical,.25,.55)*.15;
  vec3 c=vec3(.002,.003,.005)+vec3(key+secondary+ceiling+softbox);
  c+=vec3(.012,.025,.10)*band(a,2.1,.8);
  c+=vec3(.04,.05,.08)*band(a,-2.5,.8)*.2;
  return c;
}
void main(){
  vec3 N=normalize(vNormal);
  if(!gl_FrontFacing)N=-N;
  vec3 V=normalize(cameraPosition-vWorldPosition);
  float facing=abs(dot(N,V));
  float fresnel=pow(1.0-facing,3.0);
  float spread=.055*uChromatic+uPulse*.022;
  vec3 rR=refract(-V,N,1.0/(1.46-spread));
  vec3 rG=refract(-V,N,1.0/1.46);
  vec3 rB=refract(-V,N,1.0/(1.46+spread));
  // A second interface folds the exiting ray, exposing dispersion on the chamfers.
  vec3 transmission=vec3(studio(rR).r,studio(rG).g,studio(rB).b);
  vec3 reflectDir=reflect(-V,N);
  vec3 reflection=studio(reflectDir);
  vec3 iridescence=vec3(studio(normalize(reflectDir+vec3(spread,0.,0.))).r,studio(reflectDir).g,studio(normalize(reflectDir-vec3(spread,0.,0.))).b);
  float stripe=vLocal.x*.36+vLocal.y*.23+N.x*.48-N.z*.08+sin(uTime*.22)*.018;
  float strength=(.02+fresnel*.5)*(1.+uPulse*.8);
  vec3 spectrum=vec3(band(stripe,.39,.038),band(stripe,.455,.031),band(stripe,.515,.037))*strength*1.9;
  vec3 color=vec3(.002,.003,.006)+transmission*.12;
  color+=mix(reflection,iridescence,.82)*(.12+fresnel*1.5);
  color+=spectrum*2.2;
  float bevelLight=pow(max(dot(N,normalize(vec3(-.35,.7,1.2))),0.),60.);
  color+=vec3(.8,.94,1.)*bevelLight*.6;
  // Deep blue glass sides, with bright but fine polished rims.
  color+=vec3(.009,.02,.055)*pow(1.-facing,1.3);
  float micro=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
  color+=micro*.005;
  gl_FragColor=vec4(color,1.0);
}`;
const chromaticShader={
  uniforms:{tDiffuse:{value:null},uResolution:{value:new THREE.Vector2(1,1)},uPulse:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uResolution;uniform float uPulse;varying vec2 vUv;
  void main(){vec2 offset=vec2((.38+uPulse*3.2)/uResolution.x,0.);vec4 center=texture2D(tDiffuse,vUv);vec3 c=vec3(texture2D(tDiffuse,vUv+offset).r,center.g,texture2D(tDiffuse,vUv-offset).b);gl_FragColor=vec4(c,center.a);}`
};
const clamp=THREE.MathUtils.clamp;
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const ease=t=>1-Math.pow(1-clamp(t,0,1),4);

export function createPrism(container,{reducedMotion=false,onReady=()=>{}}={}){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){throw new Error('WebGL indisponível',{cause:error});}
  renderer.setClearColor(0x101010,1);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  container.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x101010);
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,0,9.2);
  const group=new THREE.Group();scene.add(group);
  const uniforms={uTime:{value:0},uPulse:{value:0},uChromatic:{value:1.9}};
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide});
  const rimMaterials=[];
  function piece(letter){
    const result=new THREE.Group();const geometry=logoGeometry(letter);result.geometry=geometry;
    result.add(new THREE.Mesh(geometry,material));
    const contour=geometry.userData.contour;
    for(const [color,offset,opacity,z] of [[0xeaf4ff,0,.73,0],[0x234bff,.016,.6,0],[0xff263c,-.014,.35,0],[0x5cff70,-.006,.23,.008],[0x7297cb,0,.22,-.625]]){
      const g=new THREE.BufferGeometry().setFromPoints(contour.map(p=>new THREE.Vector3(p.x+offset,p.y,p.z+z)));
      const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false});rimMaterials.push(m);
      const line=new THREE.LineLoop(g,m);result.add(line);
    }
    return result;
  }
  const p=piece('P');const l=piece('L');
  group.add(p,l);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.35,.4,.65);composer.addPass(bloom);
  const chromatic=new ShaderPass(chromaticShader);composer.addPass(chromatic);composer.addPass(new OutputPass());
  let width=1,height=1,mobile=false,raf=0,paused=reducedMotion,disposed=false;
  let scrollY=window.scrollY;
  const closingElement=document.querySelector('[data-scene="closing"]');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const pointer={x:0,y:0},follow={x:0,y:0};
  let lastFrame=0;
  let bounds={hero:0,connect:0,closing:0};
  let visible=true,activeScene=true;
  function measure(){
    width=window.innerWidth;height=window.innerHeight;mobile=width<761;
    renderer.setSize(width,height);composer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
    chromatic.uniforms.uResolution.value.set(width*renderer.getPixelRatio(),height*renderer.getPixelRatio());
    for(const k of Object.keys(bounds)){const el=document.querySelector(`[data-scene="${k}"]`);bounds[k]={top:el.offsetTop,height:el.offsetHeight};}
    scrollY=window.scrollY;wake();
  }
  function targetAtScroll(){
    const hero=bounds.hero,connect=bounds.connect,closing=bounds.closing;
    const s=scrollY;
    const closeVis=s+height>closing.top+80&&s<closing.top+closing.height;
    const connectT=smooth(hero.top+hero.height*.24,connect.top+connect.height*.22,s);
    const hiding=1-smooth(connect.top+connect.height-height*.5,connect.top+connect.height-height*.12,s);
    const closingAlpha=smooth(closing.top-height*.85,closing.top-height*.2,s);
    const opacity=closeVis?closingAlpha:hiding;
    activeScene=opacity>.01;
    container.style.opacity=opacity.toFixed(3);
    let x=THREE.MathUtils.lerp(mobile?.15:.45,mobile?.6:1.6,connectT);
    let y=THREE.MathUtils.lerp(mobile?.85:.5,mobile?1.0:.3,connectT);
    let scale=THREE.MathUtils.lerp(mobile?.38:.74,mobile?.36:.68,connectT);
    let rx=THREE.MathUtils.lerp(-.20,.28,connectT),ry=THREE.MathUtils.lerp(-.32,.5,connectT),rz=THREE.MathUtils.lerp(-.11,.13,connectT);
    if(closeVis){x=mobile?.35:.75;y=mobile?.4:.25;scale=mobile?.38:.82;rx=.13;ry=-.4;rz=.13;}
    return {x,y,scale,rx,ry,rz,closeVis};
  }
  // Assembly follows scroll. Only the final section adds a gentle pointer response.
  function draw(time){
    raf=0;if(disposed||!visible)return;
    const target=targetAtScroll();
    const canFollow=target.closeVis&&!paused&&!mobile&&finePointer.matches;
    if(!canFollow){pointer.x=pointer.y=follow.x=follow.y=0;}
    const dt=Math.min((time-lastFrame)/1000||1/60,.05);lastFrame=time;
    const blend=1-Math.exp(-9*dt);
    follow.x+=(pointer.x-follow.x)*blend;follow.y+=(pointer.y-follow.y)*blend;
    const moving=Math.abs(pointer.x-follow.x)+Math.abs(pointer.y-follow.y)>.0005;
    if(!moving){follow.x=pointer.x;follow.y=pointer.y;}
    const progress=paused?1:clamp(scrollY/(bounds.connect.top+bounds.connect.height*.12),0,1);
    const join=smooth(0,.83,progress),settle=smooth(.68,1,progress);
    const pulse=paused?0:Math.exp(-Math.pow((progress-.88)/.035,2));
    uniforms.uTime.value=progress*4;uniforms.uPulse.value=pulse;chromatic.uniforms.uPulse.value=pulse;
    p.position.set((mobile?-1.6:-3.4)*(1-join),.16*(1-join),.82*(1-settle));
    p.rotation.set(.06*(1-settle),-.28*(1-settle),.1*(1-join));
    l.position.set(.38*(1-settle),-.06*(1-settle),0);l.rotation.z=-.08*(1-settle);
    group.position.set(target.x+follow.x*.65,target.y-follow.y*.4,0);group.scale.setScalar(target.scale);
    group.rotation.set(target.rx+follow.y*.14,target.ry+follow.x*.22,target.rz-follow.x*.045);
    container.dataset.pointer=`${follow.x.toFixed(3)},${follow.y.toFixed(3)}`;
    container.dataset.progress=progress.toFixed(4);
    if(activeScene)composer.render();
    if(canFollow&&moving)wake();
  }
  function wake(){if(disposed||!visible)return;if(!raf)raf=requestAnimationFrame(draw);}
  const onPointer=event=>{
    if(event.pointerType!=='mouse'||paused||mobile||!finePointer.matches)return;
    pointer.x=clamp(event.clientX/width*2-1,-1,1);
    pointer.y=clamp(event.clientY/height*2-1,-1,1);wake();
  };
  const resetPointer=()=>{pointer.x=pointer.y=0;wake();};
  closingElement.addEventListener('pointermove',onPointer,{passive:true});
  closingElement.addEventListener('pointerleave',resetPointer);
  window.addEventListener('blur',resetPointer);
  const onScroll=()=>{scrollY=window.scrollY;wake();};
  const onVisibility=()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0;}else wake();};
  const onLost=e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;container.classList.remove('ready');container.dataset.renderer='unavailable';};
  const onRestored=()=>{container.classList.add('ready');container.dataset.renderer='ready';wake();};
  window.addEventListener('resize',measure);window.addEventListener('scroll',onScroll,{passive:true});document.addEventListener('visibilitychange',onVisibility);
  renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestored);
  const ro=new ResizeObserver(measure);ro.observe(document.querySelector('main'));
  measure();renderer.compile(scene,camera);composer.render();container.classList.add('ready');container.dataset.renderer='ready';onReady();wake();
  return {
    reduceMotion(value){paused=value;wake();},
    dispose(){disposed=true;closingElement.removeEventListener('pointermove',onPointer);closingElement.removeEventListener('pointerleave',resetPointer);window.removeEventListener('blur',resetPointer);cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',onVisibility);renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestored);p.geometry.dispose();l.geometry.dispose();material.dispose();group.traverse(o=>{if(o.isLine){o.geometry.dispose();o.material.dispose();}});composer.passes.forEach(pass=>pass.dispose?.());composer.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}


// Small instances of the same original P/L geometry, sharing one animation loop.
export function createFeatureLogos(containers,{reducedMotion=false}={}){
  const geometryP=logoGeometry('P'),geometryL=logoGeometry('L');
  const uniforms={uTime:{value:0},uPulse:{value:0},uChromatic:{value:2.1}};
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment.replace('gl_FragColor=vec4(color,1.0);',`gl_FragColor=vec4(color*1.55,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>`),side:THREE.DoubleSide});
  let raf=0,last=0,elapsed=0,paused=false,reduced=reducedMotion,disposed=false;
  const entries=[];
  const button=document.querySelector('#toggle-feature-motion');
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function updateButton(){button.hidden=reduced||!entries.length;button.setAttribute('aria-pressed',String(paused));button.innerHTML=paused?'Retomar giro <span aria-hidden="true">▷</span>':'Pausar giro <span aria-hidden="true">Ⅱ</span>';}
  function frame(time){
    raf=0;if(disposed||document.hidden)return;
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;
    if(!paused&&!reduced)elapsed+=dt;
    for(const entry of entries){if(!entry.visible)continue;
      const angle=reduced?0:elapsed*Math.PI*2/12;
      entry.group.rotation.set(-.15,angle+entry.phase,-.08);
      entry.renderer.render(entry.scene,entry.camera);
      entry.container.dataset.turn=(angle/(Math.PI*2)).toFixed(4);
    }
    if(!paused&&!reduced&&entries.some(entry=>entry.visible))raf=requestAnimationFrame(frame);else last=0;
  }
  function wake(){if(!raf&&!document.hidden&&!disposed)raf=requestAnimationFrame(frame);}
  function measure(){for(const e of entries){const {width,height}=e.container.getBoundingClientRect();e.renderer.setSize(width,height,false);e.camera.aspect=width/height;e.camera.updateProjectionMatrix();}wake();}
  function toggle(){paused=!paused;updateButton();wake();}
  const onVisibility=()=>document.hidden?stop():wake();
  for(const [index,container] of [...containers].entries()){
    try{
      const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x101010,0);
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,30);camera.position.z=6.9;
      const group=new THREE.Group();scene.add(group);
      for(const geometry of [geometryP,geometryL]){
        group.add(new THREE.Mesh(geometry,material));
        for(const [color,offset,opacity] of [[0xeaf4ff,0,.95],[0x4d73ff,.02,.8],[0xff4664,-.016,.45]]){
          const rim=new THREE.BufferGeometry().setFromPoints(geometry.userData.contour.map(p=>new THREE.Vector3(p.x+offset,p.y,p.z)));
          group.add(new THREE.LineLoop(rim,new THREE.LineBasicMaterial({color,transparent:true,opacity,toneMapped:false})));
        }
      }
      container.append(renderer.domElement);container.classList.add('ready');
      entries.push({container,renderer,scene,camera,group,phase:[-.25,.2,-.45][index],visible:false});
    }catch{container.dataset.renderer='unavailable';}
  }
  const observer=new IntersectionObserver(changes=>{for(const change of changes){const entry=entries.find(e=>e.container===change.target);if(entry)entry.visible=change.isIntersecting;}if(entries.some(e=>e.visible))wake();else stop();},{threshold:.01});
  entries.forEach(e=>observer.observe(e.container));
  const resize=new ResizeObserver(measure);entries.forEach(e=>resize.observe(e.container));
  button.addEventListener('click',toggle);document.addEventListener('visibilitychange',onVisibility);measure();updateButton();
  return {reduceMotion(value){reduced=value;updateButton();wake();},dispose(){disposed=true;stop();observer.disconnect();resize.disconnect();button.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',onVisibility);for(const e of entries){e.group.traverse(o=>{if(o.isLine){o.geometry.dispose();o.material.dispose();}});e.renderer.dispose();e.renderer.domElement.remove();e.container.classList.remove('ready');}geometryP.dispose();geometryL.dispose();material.dispose();}};
}
