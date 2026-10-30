(()=>{'use strict';
const stage=document.getElementById('stage');if(!stage)return;
const css=document.createElement('style');css.textContent=`
#sg70controls{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:10px 14px;padding:10px;background:#0a3039;border:1px solid #407b83;border-radius:12px;color:#c8e9e4;font:13px system-ui}
#sg70controls button{padding:9px 12px;border-radius:8px;border:1px solid #5a9a9c;background:#123b49;color:#dcf9f4;font-weight:600}#sg70controls button.active{background:#147b72;border-color:#91efcf}#sg70controls .info{flex-basis:100%;font-size:12px;color:#b6d8d5}
#sg70panel{position:absolute;left:50%;top:23%;transform:translateX(-50%);width:min(54%,290px);z-index:19;pointer-events:none;display:none;text-align:center}
#sg70panel .cutout{max-width:100%;width:100%;max-height:210px;object-fit:contain;filter:drop-shadow(0 0 11px #5fffc0)}
#sg70panel .label{display:block;background:#04232de8;border:1px solid #4ea994;border-radius:8px;padding:6px;color:#d5fff0;font:12px system-ui;overflow-wrap:anywhere}
#sg70panel .actions{pointer-events:auto;display:flex;gap:5px;justify-content:center;margin-top:5px}
#sg70panel button{font:12px system-ui;padding:7px;background:#104c53;color:white;border:1px solid #65ada6;border-radius:7px}
#sg70panel .ray{height:60px;width:1px;border-left:1px dashed #6de2c0;margin:auto}
#sg70panel .note{font:11px system-ui;color:#a3e1d7;background:#061d28dd;border-radius:5px;padding:3px}
@media(max-width:500px){#sg70panel{width:46%;top:25%}#sg70panel .cutout{max-height:130px}#sg70panel .ray{height:35px}}
`;document.head.append(css);
const controls=document.createElement('div');controls.id='sg70controls';controls.innerHTML='<strong>CAMERA EVIDENCE · PERSPECTIVE VIEW</strong><button data-mode="object">Objects</button><button data-mode="motion">Motion</button><button data-mode="combined">Combined</button><span class="info" id="sg70info">Objects: selected camera cells and saved evidence. Motion is hidden by default; perspective is illustrative, not measured depth.</span>';
const stageParent=stage.parentNode;stageParent.insertBefore(controls,stage);
const panel=document.createElement('div');panel.id='sg70panel';panel.innerHTML='<img class="cutout" alt="Saved camera selection with its original shape"><div class="label"></div><div class="note">2D visual evidence · distance unknown</div><div class="actions"><button id="sg70dispatch">Open dispatch</button><button id="sg70clear">Clear object</button></div><div class="ray"></div>';stage.append(panel);
const modes={object:'Objects: camera-selected pixels only. Motion is hidden; range is unknown unless independently supplied.',motion:'Motion: image changes, including possible camera movement. Not a 3D scan.',combined:'Combined: selected object plus cyan motion observations. Motion does not indicate depth.'};
let mode='object',packet=null,saved=false;
function setMode(m){if(!modes[m])return;mode=m;window.sg70EvidenceMode=m;controls.querySelectorAll('button[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',String(b.dataset.mode===m))});document.getElementById('sg70info').textContent=modes[m];panel.style.display=(packet&&m!=='motion')?'block':'none';const old=document.getElementById('sg63');if(old)old.style.display='none';const oldStatus=document.getElementById('sg63status');if(oldStatus)oldStatus.style.display='none';}
controls.querySelectorAll('button[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function render(){if(!packet?.previewPng)return;panel.querySelector('img').src=packet.previewPng;const name=document.getElementById('cdTitle')?.value.trim()||'Unlabelled selection';const range=Number(document.getElementById('range')?.value);const rangeText=range>0?`Manually entered range ${range} m`:'Distance unknown';panel.querySelector('.label').textContent=`${saved?'SAVED':'LIVE SELECTION'} · ${name} · ${packet.cells||'?'} cells · ${packet.boundsPx?.width||'?'}×${packet.boundsPx?.height||'?'} image px`;panel.querySelector('.note').textContent=`${rangeText} · ${packet.capturedAt||new Date().toISOString()} · 2D camera evidence`;panel.style.display=mode==='motion'?'none':'block';}
window.addEventListener('sg-v57-selection',e=>{if(!e.detail?.objectPacket)return;packet=e.detail.objectPacket;saved=true;render();setMode(mode)});
window.addEventListener('sg-v57-clear',()=>{packet=null;saved=false;panel.style.display='none';try{localStorage.removeItem('sg70_saved_object')}catch(e){}});
document.getElementById('cdTitle')?.addEventListener('input',render);
document.getElementById('range')?.addEventListener('input',render);
document.getElementById('s57apply')?.addEventListener('click',()=>{if(packet){saved=true;render();try{localStorage.setItem('sg70_saved_object',JSON.stringify(packet))}catch(e){}}});
document.getElementById('sg70dispatch').onclick=()=>document.getElementById('cameraDispatch')?.scrollIntoView({behavior:'smooth',block:'start'});
document.getElementById('sg70clear').onclick=()=>{packet=null;saved=false;panel.style.display='none';try{localStorage.removeItem('sg70_saved_object')}catch(e){};document.getElementById('s57clear')?.click()};
try{const p=JSON.parse(localStorage.getItem('sg70_saved_object')||'null');if(p?.previewPng){packet=p;saved=true;render()}}catch(e){}
setMode('object');
})();
