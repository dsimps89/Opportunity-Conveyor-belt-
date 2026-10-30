(()=>{'use strict';
const $=id=>document.getElementById(id),v=$('camera'),overlay=$('cameraOverlay'),oc=overlay.getContext('2d'),layer=$('fusionOverlay'),c=layer.getContext('2d');
const NX=80,NY=60,N=NX*NY,off=document.createElement('canvas');off.width=320;off.height=240;const a=off.getContext('2d',{willReadFrequently:true});
const motion=new Float32Array(N);let previous=null,active=0,lastSample=0,lastStats=0,selected=null,phase=0,rawActive=0,globalShift=0,sceneStatus='Waiting for camera',stableFrames=0;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function align(){const on=!v.classList.contains('hidden');overlay.classList.toggle('hidden',!on);if(!on)return;overlay.style.left='0px';overlay.style.top='0px';overlay.style.width='100%';overlay.style.height='100%';overlay.style.right='auto'}
function sample(t){if(t-lastSample<180||v.readyState<2||v.classList.contains('hidden'))return;lastSample=t;try{
// Both the camera preview (object-fit:cover) and the analysis use a centre crop at 4:3.
const vw=v.videoWidth,vh=v.videoHeight;
a.clearRect(0,0,320,240);
a.drawImage(v,0,0,vw,vh,0,0,320,240);const data=a.getImageData(0,0,320,240).data,grey=new Uint8Array(320*240);for(let i=0;i<grey.length;i++)grey[i]=(data[i*4]*3+data[i*4+1]*6+data[i*4+2])/10;
if(previous){
const delta=new Float32Array(N),diffs=[];
for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
let sum=0, signed=0;
for(let y=j*4;y<j*4+4;y++)for(let x=i*4;x<i*4+4;x++){const k=y*320+x;const d=grey[k]-previous[k];sum+=Math.abs(d);signed+=d}
const id=j*NX+i;delta[id]=sum/16;diffs.push(signed/16)
}
diffs.sort((a,b)=>a-b);
globalShift=diffs[Math.floor(N/2)];
// Correct uniform exposure shifts before motion detection.
active=0;rawActive=0;
for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
const id=j*NX+i;let corrected=0;
for(let y=j*4;y<j*4+4;y++)for(let x=i*4;x<i*4+4;x++){const k=y*320+x;corrected+=Math.abs(grey[k]-previous[k]-globalShift)}
corrected/=16;
motion[id]=motion[id]*.48+corrected*.52;
if(delta[id]>13)rawActive++;
if(motion[id]>Math.max(17,Math.abs(globalShift)*.6+13))active++;
}
const fraction=active/N;
sceneStatus=fraction>.5?'High global activity · stabilize phone':fraction>.18?'Moderate image changes · motion unverified':fraction>.025?'Localized visual activity':'Low visual activity';
stableFrames=fraction<.18?Math.min(100,stableFrames+1):0;
}previous=grey
}catch(e){$('scoreExplanation').textContent='Camera analysis error: '+e.message}}
function cameraOverlay(){oc.clearRect(0,0,240,180);oc.fillStyle='#06222acc';oc.fillRect(0,0,240,17);oc.fillStyle='#c3f8e9';oc.font='10px system-ui';oc.fillText('80 × 60 · 4,800 CELLS',5,12);// ALWAYS show a fine visible camera grid, even when there is no motion.
oc.strokeStyle='rgba(91,243,221,.40)';oc.lineWidth=.45;
for(let i=0;i<=NX;i+=4){let x=i*3+.5;oc.beginPath();oc.moveTo(x,18);oc.lineTo(x,164);oc.stroke()}
for(let j=0;j<=NY;j+=4){let y=j*3+.5;if(y<18||y>164)continue;oc.beginPath();oc.moveTo(0,y);oc.lineTo(240,y);oc.stroke()}
if(!previous)return;
for(let j=0;j<NY;j+=2)for(let i=0;i<NX;i+=2){const m=motion[j*NX+i];if(m>13){oc.fillStyle=`rgba(80,231,226,${clamp(m/65,.12,.55)})`;oc.fillRect(i*3,j*3,6,6)}}
oc.fillStyle='#06222acc';oc.fillRect(0,164,240,16);oc.fillStyle='#e5f8f0';oc.fillText(`${active} changing · depth unknown`,5,176);
if(selected){oc.strokeStyle='#f6e98d';oc.lineWidth=2;oc.strokeRect(selected.i*3-3,selected.j*3-3,9,9)}}
overlay.addEventListener('pointerdown',e=>{const r=overlay.getBoundingClientRect();selected={i:clamp(Math.floor((e.clientX-r.left)/r.width*NX),0,NX-1),j:clamp(Math.floor((e.clientY-r.top)/r.height*NY),0,NY-1),utc:new Date().toISOString()};$('fusionInsight').textContent=`Selected image cell (${selected.i+1},${selected.j+1}) of 80×60 at ${selected.utc.slice(11,23)} UTC. Image angle only; no measured depth or identified object.`});
function line(x,y,X,Y,color,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=w;c.stroke()}
function txt(s,x,y,color='#acd0d6',size=12){c.font=`${size}px system-ui`;c.fillStyle=color;c.fillText(s,x,y)}
function zoom(dir){const sel=$('radius'),choices=[...sel.options].map(o=>+o.value),idx=choices.indexOf(+sel.value);sel.value=choices[clamp(idx-dir,0,choices.length-1)];sel.dispatchEvent(new Event('change'))}
$('zoomIn').onclick=()=>zoom(1);$('zoomOut').onclick=()=>zoom(-1);
let pinch=0;$('stage').addEventListener('touchmove',e=>{if(e.touches.length!==2)return;const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pinch&&Math.abs(d-pinch)>70){zoom(d>pinch?1:-1);pinch=d}else if(!pinch)pinch=d},{passive:true});$('stage').addEventListener('touchend',()=>pinch=0);
function frame(t){align();sample(t);cameraOverlay();c.clearRect(0,0,960,720);const state=window.SG46?.snapshot(),mode=state?.view||'perspective',R=state?.radius||500,step=R/5;
// Preserve the original base map, pillars, globe and lock rendering. Overlay only labels, measurements and image activity.
const project=(e,n)=>mode==='overhead'?[480+e/R*290,374-n/R*290]:[480+e/R*300/(1+n/R*1.7),518-n/R*310/(1+n/R*1.7)];
// Clear metric edge ruler. The animated scan line moves; the ruler stays fixed.
const labels=[];const label=(text,x,y,color='#b7dcd5')=>labels.push({s:text,x,y,color});
if(mode!=='globe'){
const speed=Number($('speed')?.value||40)/100;
const drift=(t*.00016*speed)%1;
const proj=(e,n)=>mode==='overhead'?[480+e/R*290,374-n/R*290]:[480+e/R*300/(1+n/R*1.7),518-n/R*310/(1+n/R*1.7)];
const fmt=m=>Math.abs(m)>=1000?(m/1000).toFixed(1)+'km':Math.round(m)+'m';
for(let k=0;k<=5;k++){
const n=k*R/5,p=proj(-R,n),q=proj(R,n);
line(...p,...q,'rgba(79,165,121,.18)',.8);
if(k>0){const y=mode==='overhead'?p[1]:p[1];if(y>180&&y<635)label(`N ${fmt(n)}`,18,y,'#b4ebc4')}
const e=k*R/5,pe=proj(e,0);
if(k>0)label(`E ${fmt(e)}`,clamp(pe[0],95,860),mode==='overhead'?682:646,'#a3d7e9');
}
for(let k=0;k<6;k++){
const n=((k+drift)/6)*R,p=proj(-R,n),q=proj(R,n);
line(...p,...q,'rgba(107,232,162,.53)',1.2)
}
const centre=proj(0,0),cw=t*.00026,ccw=-cw*.68;
for(let deg=0;deg<360;deg+=45){
const theta=deg*Math.PI/180,p=proj(Math.sin(theta)*R*.83,Math.cos(theta)*R*.83);
if(mode==='overhead'&&p[0]>90&&p[0]<875&&p[1]>200&&p[1]<610)label(`${deg}°`,p[0],p[1],'#8fbde4')
}
label(`CW ${((cw*180/Math.PI)%360).toFixed(0)}°`,690,186,'#91d4fa');
label(`CCW ${(((ccw*180/Math.PI)%360)+360)%360|0}°`,690,207,'#f0d19b');
label(`GRID ${fmt(R/5)}/DIV`,20,702,'#a7e7bd');
}else{
label('GLOBE · LATITUDE / LONGITUDE (°)',330,190,'#b5dfdd');
}
if(previous && window.sg70EvidenceMode!=='object'){let shown=0;for(let j=0;j<NY;j+=2)for(let i=0;i<NX;i+=2){const val=motion[j*NX+i];if(val<17)continue;const angle=((i+.5)/NX-.5)*65*Math.PI/180,dist=.2+.58*(j+.5)/NY;const x=480+Math.sin(angle)*410*dist,y=480-Math.cos(angle)*240*dist;c.fillStyle=`rgba(93,231,230,${clamp(val/65,.12,.65)})`;c.fillRect(x-2,y-2,4,4);shown++}if(shown)label('IMAGE MOTION · DEPTH UNKNOWN',515,260,'#75d9df')}
if(selected){const ang=((selected.i+.5)/NX-.5)*65*Math.PI/180,dist=.2+.58*(selected.j+.5)/NY,x=480+Math.sin(ang)*410*dist,y=480-Math.cos(ang)*240*dist;c.strokeStyle='#f6ec8b';c.lineWidth=2;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.stroke();label('SELECTED · RANGE UNKNOWN',x+15,y-10,'#f6ec8b')}
// Collision-aware labels: avoid stacking numbers on top of each other.
const placed=[];for(const l of labels){c.font='12px system-ui';const width=c.measureText(l.s).width+6;if(placed.some(p=>Math.abs(p.y-l.y)<19&&l.x<p.x+p.w+7&&l.x+width>p.x))continue;placed.push({x:l.x,y:l.y,w:width});txt(l.s,l.x,l.y,l.color)}
if(t-lastStats>1100){lastStats=t;const cam=!!state?.streamOn,gps=!!state?.origin,head=Number.isFinite(state?.heading),range=!!state?.target&&state.target.range>0;const cal=(cam?15:0)+(gps?25:0)+(head?20:0)+(range?30:0)+(gps&&head&&range?10:0);
const candidates=state?.opportunities||[];let nearby=[];if(gps){nearby=candidates.filter(p=>{const lat=+p.lat,lon=+p.lon;if(!Number.isFinite(lat)||!Number.isFinite(lon))return false;const e=(lon-state.origin.lon)*111320*Math.cos(state.origin.lat*Math.PI/180),n=(lat-state.origin.lat)*111320;return Math.hypot(e,n)<=R})}
$('calScore').textContent=cal+' / 100';$('cellScore').textContent=active.toLocaleString();$('oppScore').textContent=nearby.length?`${nearby.length} nearby`:'—';$('scoreExplanation').textContent=`Readiness: camera ${cam?15:0}/15 · GPS ${gps?25:0}/25 · heading ${head?20:0}/20 · manually measured target range ${range?30:0}/30 · complete reference ${gps&&head&&range?10:0}/10. This is sensor setup readiness, NOT positional accuracy. Moving lines are scan phase; their labelled distances are grid coordinates. ${active}/${N} camera cells changing. ${nearby.length?nearby.length+' user-imported opportunity records within radius.':'No geolocated opportunity evidence within radius.'}`;
const action=!cam?'Start the camera.':active/N>.5?'Hold the phone steady for a few seconds.':!gps?'Enable GPS to anchor the geographic view.':!head?'Enable compass heading for camera bearing.':!range?'Lock a visible feature and enter an independently measured range.':nearby.length?'Inspect sourced opportunities and compare their provenance.':'Import sourced opportunities with coordinates.';
$('fusionInsight').textContent=`SCENE: ${sceneStatus}. Filtered activity ${(active/N*100).toFixed(1)}% (${active}/${N}); raw ${rawActive}/${N}; exposure offset ${globalShift.toFixed(1)} grey levels. SPACE: ${gps?'GPS anchored':'unanchored'}, ${head?'heading present':'heading unknown'}, ${range?'range supplied':'depth unknown'}. OPPORTUNITIES: ${nearby.length} sourced records within ${R} m. NEXT: ${action}`;
}
requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();