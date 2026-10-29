(()=>{'use strict';
const q=id=>document.getElementById(id),dock=q('cameraDock'),viewport=q('cameraViewport'),video=q('camera'),overlay=q('cameraOverlay');
// The video and analysis overlay must share the same containing block.
viewport.append(video,overlay);
const open=q('dockDetailed'),toggle=q('dockToggle'),staticOpen=q('s57open');
open.addEventListener('click',()=>{if(video.readyState<2){q('dockState').textContent='Start camera first';q('start').click();return}staticOpen.click()});
toggle.addEventListener('click',()=>{const hidden=dock.classList.toggle('collapsed');toggle.textContent=hidden?'Show preview':'Hide preview';q('dockState').textContent=hidden?'Preview hidden · camera still running':'Live full-frame preview'});
// Clicking the image opens the detailed camera for accurate multi-cell selection.
video.addEventListener('click',()=>open.click());
q('cameraSizeFloat').onclick=()=>open.click();
q('cdExpand').onclick=()=>open.click();
q('schCameraBtn').onclick=()=>open.click();
// Keep the full camera frame visible without stretching or cropping.
video.addEventListener('loadedmetadata',()=>{if(video.videoWidth&&video.videoHeight){viewport.style.aspectRatio=video.videoWidth+'/'+video.videoHeight;q('dockState').textContent=video.videoWidth+' × '+video.videoHeight+' live frame'}});
window.addEventListener('sg-v57-selection',e=>{const p=e.detail?.objectPacket;if(p)q('dockState').textContent='Saved packet · '+p.cells+' cells · '+p.regions+' region(s)';});
})();