(()=>{'use strict';const q=id=>document.getElementById(id),dock=q('cameraDock'),video=q('camera'),toggle=q('dockToggle'),state=q('dockState');
function setState(on,msg){dock.classList.toggle('camera-on',on);state.textContent=msg;if(on){dock.classList.remove('collapsed');toggle.textContent='Hide preview'}}
window.addEventListener('sg-camera-state',e=>setState(e.detail.on,e.detail.message));
if(video.readyState>=2&&video.srcObject)setState(true,'Full-frame camera');
toggle.addEventListener('click',()=>requestAnimationFrame(()=>{toggle.textContent=dock.classList.contains('collapsed')?'Show preview':'Hide preview'}));
q('dockMonitor').addEventListener('click',()=>{document.body.classList.add('sg-monitor');document.title='Situational Geometry · Full-screen Scanner';window.dispatchEvent(new Event('resize'));});
q('sgExitMonitor').addEventListener('click',()=>{document.body.classList.remove('sg-monitor');window.dispatchEvent(new Event('resize'));});
})();