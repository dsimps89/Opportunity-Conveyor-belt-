(()=>{'use strict';
const stage=document.getElementById('stage');if(!stage)return;
const css=document.createElement('style');css.textContent=`
#sg63{position:absolute;z-index:18;left:50%;top:23%;transform:translateX(-50%);width:min(43%,230px);display:none;text-align:center;pointer-events:none}
#sg63 .shape{display:block;margin:0 auto;max-width:100%;max-height:145px;object-fit:contain;image-rendering:auto;filter:drop-shadow(0 0 9px #51e9c1)}
#sg63 .cap{font:11px system-ui;color:#bafce8;text-shadow:0 1px 4px #001;padding:3px 0;background:#05252dbb;border-radius:5px}
#sg63 .edit{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-top:4px;pointer-events:auto;background:#05252de8;padding:4px;border:1px solid #55b9a7;border-radius:8px}
#sg63 input{width:46%;min-width:64px;box-sizing:border-box;background:#092b33;border:1px solid #568f90;color:white;border-radius:5px;font:11px system-ui;padding:5px}
#sg63 button{font:11px system-ui;padding:5px 7px;background:#175763;color:#e9fffa;border:1px solid #66b6ad;border-radius:5px}
#sg63 .x{position:absolute;top:-12px;right:-13px;pointer-events:auto;border-radius:100%;background:#163a43}
#sg63 .line{position:absolute;left:50%;top:100%;height:60px;border-left:1px dashed #5de5c0aa;pointer-events:none}
#sg63status{position:absolute;left:50%;top:43%;transform:translateX(-50%);z-index:15;color:#abffe0;font:11px system-ui;text-align:center;background:#06222bbd;padding:3px 8px;border-radius:6px;display:none;pointer-events:none}
`;document.head.append(css);
const ui=document.createElement('div');ui.id='sg63';ui.innerHTML='<button class="x" type="button" title="Hide selected hologram">×</button><img class="shape" alt="Selected camera cells, isolated from the frame"><div class="cap">SELECTED CAMERA CELLS · STATIC IMAGE · DEPTH UNKNOWN</div><div class="edit"><input id="sg63title" placeholder="Item label" aria-label="Item label"><input id="sg63price" type="number" min="0" step="0.01" placeholder="Price $" aria-label="Price"><button id="sg63local" type="button">Send to track</button><button id="sg63live" type="button">Send live</button></div><div class="line"></div>';stage.append(ui);
const status=document.createElement('div');status.id='sg63status';stage.append(status);
const title=document.getElementById('cdTitle'),price=document.getElementById('cdValue');let current=null;
function hide(){ui.style.display='none';status.style.display='none'}
function clear(){current=null;hide();window.sgCamera55Selection=null;try{localStorage.removeItem('sg63_current')}catch(e){}}
function show(p){if(!p?.previewPng)return;current=p;ui.querySelector('.shape').src=p.previewPng;ui.style.display='block';status.style.display='block';status.textContent=`${p.cells} selected cells · ${p.boundsPx.width} × ${p.boundsPx.height} image px`;
// The older V62 temporary foreground preview is intentionally suppressed.
const v62=document.getElementById('sg62preview');if(v62)v62.style.display='none';
const legacy=document.getElementById('sgObjectHologram');if(legacy)legacy.style.display='none';if(legacy?.nextElementSibling)legacy.nextElementSibling.style.display='none';
try{localStorage.setItem('sg63_current',JSON.stringify(p))}catch(e){}
}
window.addEventListener('sg-v57-selection',e=>{show(e.detail?.objectPacket);setTimeout(()=>{const v62=document.getElementById('sg62preview');if(v62)v62.style.display='none'},0)});
window.addEventListener('sg-v57-clear',clear);window.addEventListener('sg65-dispatched',hide);
ui.querySelector('.x').onclick=hide;
const label=ui.querySelector('#sg63title'),cost=ui.querySelector('#sg63price');
label.value=title.value;cost.value=price.value;
label.addEventListener('input',()=>{title.value=label.value;title.dispatchEvent(new Event('input',{bubbles:true}))});cost.addEventListener('input',()=>{price.value=cost.value;price.dispatchEvent(new Event('input',{bubbles:true}))});
title.addEventListener('input',()=>{if(document.activeElement!==label)label.value=title.value});price.addEventListener('input',()=>{if(document.activeElement!==cost)cost.value=price.value});
function send(button){if(!current)return;if(!title.value.trim()){label.focus();status.textContent='Add an item label before sending';return}const v62=document.getElementById('sg62preview');if(v62)v62.style.display='none';button.click();hide();status.style.display='block';status.textContent='OBJECT DISPATCHED · TRACK / SCAN';setTimeout(()=>{status.style.display='none'},3500)}
ui.querySelector('#sg63local').onclick=()=>send(document.getElementById('cdPreview'));
ui.querySelector('#sg63live').onclick=()=>send(document.getElementById('cdLive'));
// Keep selected hologram static while the detailed camera is closed or moving.
try{const saved=JSON.parse(localStorage.getItem('sg63_current')||'null');if(saved)show(saved)}catch(e){}
})();
