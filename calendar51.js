(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='sg50_calendar_events';let entries=[],played=new Set(),preview=null,started=Date.now(),lastTick=0,lastSave=0,notified=new Set(),selected=new Set(),editing=null;
const color={opportunity:'#70efb2',risk:'#ff6377',weather:'#5fd3fa',community:'#f3bd6c',commerce:'#e79be9',task:'#b6b9ff'};
const pad=n=>String(n).padStart(2,'0'),fmt=d=>new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const id=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,8),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(entries));lastSave=Date.now();$('schNotice').textContent='Saved locally · '+new Date().toLocaleTimeString()}catch(e){$('schNotice').textContent='Local storage failed: '+e.message}}
try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))entries=v.filter(x=>x&&x.label&&Number.isFinite(x.when)).slice(-12000)}catch(e){}
function dateInput(ms){const d=new Date(ms);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
$('schWhen').value=dateInput(Date.now()+3600000);$('schDays').querySelector('input[value="3"]').checked=true;
function horizon(){return ({day:86400000,week:604800000,month:30*86400000,year:365*86400000,five:5*365*86400000})[$('schHorizon').value]}
function occurrence(entry,after){const first=entry.when;if(entry.repeat!=='weekly')return first>=after?first:null;const days=entry.days||[];if(!days.length)return null;const base=new Date(first);const hh=base.getHours(),mm=base.getMinutes();let day=new Date(Math.max(after,first));day.setHours(hh,mm,0,0);if(day.getTime()<after)day.setDate(day.getDate()+1);for(let i=0;i<9;i++){if(days.includes(day.getDay())&&day.getTime()>=first)return day.getTime();day.setDate(day.getDate()+1)}return null}
function occurrences(entry,from,to,limit=500){let cursor=from,out=[];for(let k=0;k<limit;k++){const n=occurrence(entry,cursor);if(n===null||n>to)break;out.push(n);cursor=n+60000;if(entry.repeat!=='weekly')break}return out}
window.sgWatchSchedule=()=>entries.map(e=>({...e}));window.sgDispatchSelected=()=>entries.filter(e=>selected.has(e.id)).map(e=>({id:e.id,label:e.label,type:e.type,value:e.value,when:e.when,repeat:e.repeat,days:e.days||[]}));
function selectedCount(){$('schSelectionCount').textContent=selected.size+' selected'}
function renderList(){const root=$('schList');root.replaceChildren();const now=Date.now();const ordered=[...entries].sort((a,b)=>(occurrence(a,now)??Infinity)-(occurrence(b,now)??Infinity));for(const e of ordered.slice(0,350)){const row=document.createElement('div');row.className='schitem';const check=document.createElement('input');check.type='checkbox';check.checked=selected.has(e.id);check.setAttribute('aria-label','Select '+e.label);check.onchange=()=>{if(check.checked)selected.add(e.id);else selected.delete(e.id);selectedCount()};const body=document.createElement('div');body.style.flex='1';const next=occurrence(e,now);body.innerHTML=`<span style="color:${color[e.type]||color.opportunity}">●</span> <b>${esc(e.label)}</b> · ${esc(e.type)}<br><span class="muted">${next?fmt(next):'No future occurrence'} · ${e.repeat==='weekly'?'weekly':'once'}${e.value!==null&&Number.isFinite(e.value)?' · $'+e.value.toFixed(2):''}</span>`;const buttons=document.createElement('div');buttons.className='schactions';const edit=document.createElement('button');edit.textContent='Edit';edit.onclick=()=>editEntry(e);const remove=document.createElement('button');remove.textContent='Delete';remove.onclick=()=>{if(!confirm('Delete '+e.label+'?'))return;entries=entries.filter(x=>x.id!==e.id);selected.delete(e.id);save();renderList();updateSummary(Date.now())};buttons.append(edit,remove);row.append(check,body,buttons);root.append(row)}if(entries.length>350){const p=document.createElement('p');p.textContent=`Showing first 350 of ${entries.length} records. Use select all shown to select the visible items.`;root.append(p)}selectedCount()}
function editEntry(e){editing=e.id;$('schName').value=e.label;$('schLocation').value=e.location||'';$('schType').value=e.type;$('schValue').value=e.value===null?'':e.value;$('schWhen').value=dateInput(e.when);$('schRepeat').value=e.repeat;for(const ch of $('schDays').querySelectorAll('input'))ch.checked=(e.days||[]).includes(Number(ch.value));$('schAdd').textContent='Save changes';$('schCancelEdit').hidden=false;$('calendarSection').open=true;$('schName').scrollIntoView({behavior:'smooth',block:'center'});$('schNotice').textContent='Editing '+e.label+' · save changes or cancel.'}
function cancelEdit(){editing=null;$('schAdd').textContent='Add event';$('schCancelEdit').hidden=true;$('schName').value='';$('schValue').value=''}
$('schCancelEdit').onclick=cancelEdit;
$('schSelectAll').onclick=()=>{const now=Date.now(),ordered=[...entries].sort((a,b)=>(occurrence(a,now)??Infinity)-(occurrence(b,now)??Infinity));for(const e of ordered.slice(0,350))selected.add(e.id);renderList()};
$('schSelectNone').onclick=()=>{selected.clear();renderList()};
$('schDeleteSelected').onclick=()=>{if(!selected.size){$('schNotice').textContent='Select one or more items first.';return}if(!confirm('Delete '+selected.size+' selected scheduled items?'))return;entries=entries.filter(e=>!selected.has(e.id));selected.clear();cancelEdit();save();renderList();updateSummary(Date.now())};
$('schClearAll').onclick=()=>{if(!entries.length)return;if(!confirm('Clear ALL '+entries.length+' scheduled items? This cannot be undone unless you have an exported backup.'))return;entries=[];selected.clear();played.clear();cancelEdit();save();renderList();updateSummary(Date.now());$('schNotice').textContent='All scheduled items cleared.'};
function add(entry){entries.push(entry);if(entries.length>12000)entries=entries.slice(-12000);save();renderList();updateSummary(Date.now())}
$('schAdd').onclick=()=>{const label=$('schName').value.trim(),when=new Date($('schWhen').value).getTime(),valueText=$('schValue').value.trim();if(!label||!Number.isFinite(when)){$('schNotice').textContent='Enter a label and valid local date/time.';return}if(window.sg69Validate&&!window.sg69Validate(label,$('schLocation').value,when,'schNotice'))return;const days=[...$('schDays').querySelectorAll('input:checked')].map(x=>+x.value),repeat=$('schRepeat').value;if(repeat==='weekly'&&!days.length){$('schNotice').textContent='Select at least one weekday.';return}const value=valueText===''?null:Number(valueText);if(value!==null&&(!Number.isFinite(value)||value<0))return;const item={id:editing||id(),label,type:$('schType').value,value,when,repeat,days,source:'user',location:$('schLocation').value.trim().slice(0,50),created:new Date().toISOString()};if(editing){entries=entries.map(e=>e.id===editing?{...e,...item}:e);save();renderList();updateSummary(Date.now());$('schNotice').textContent='Updated '+label;cancelEdit()}else{add(item);$('schNotice').textContent='Added '+label;$('schName').value='';$('schValue').value=''}};
function dispatch(entry,time,isReplay=false){const token=entry.id+':'+time;if(played.has(token))return;played.add(token);if(played.size>4000)played.clear();window.sgWorkbenchLaunchScheduled?.(entry);const n=`${entry.type.toUpperCase()}: ${entry.label} · ${fmt(time)}`;$('schNotice').textContent=(isReplay?'PREVIEW · ':'DUE NOW · ')+n;if(!isReplay){if('vibrate'in navigator)try{navigator.vibrate(80)}catch(e){};notified.add(token)}}
function tick(now){const at=Date.now(),windowStart=lastTick||at-1000;lastTick=at;let due=0;for(const e of entries){if(due>=30)break;const hits=occurrences(e,Math.max(e.when,windowStart),at,5);for(const t of hits){if(due>=30)break;dispatch(e,t);due++}}if(at-lastSave>Number($('schAutosave').value))save();if(!preview)updateSummary(at);}
function updateSummary(time){const lookahead=Number($('schLookahead').value),to=time+Math.min(horizon(),lookahead),count=entries.reduce((n,e)=>n+occurrences(e,time,to,600).length,0);$('schSummary').textContent=`${entries.length.toLocaleString()} scheduled items · ${count.toLocaleString()} occurrences in the next ${$('schHorizon').selectedOptions[0].text} (lookahead ${$('schLookahead').selectedOptions[0].text}) · ${preview?'PREVIEW':'LIVE'}`}
function previewTime(){const now=Date.now(),p=Number($('schScale').value)/1000;return now+p*horizon()}
$('schScale').oninput=()=>{preview={at:previewTime()};$('schClock').textContent='PREVIEW · '+fmt(preview.at);updateSummary(preview.at)};
$('schHorizon').onchange=()=>{if(preview){preview={at:previewTime()};$('schClock').textContent='PREVIEW · '+fmt(preview.at)}updateSummary(preview?.at||Date.now())};
$('schNow').onclick=()=>{preview=null;$('schScale').value='0';$('schClock').textContent='LIVE · '+new Date().toLocaleTimeString();updateSummary(Date.now())};
$('schRun').onclick=()=>{const from=Date.now(),to=preview?.at||from+Number($('schLookahead').value);const low=Math.min(from,to),high=Math.max(from,to);let total=0;for(const e of entries){for(const t of occurrences(e,low,high,30)){if(total>=40)break;dispatch(e,t,true);total++}if(total>=40)break}if(!total)$('schNotice').textContent='No scheduled occurrences in the selected preview interval.';else $('schNotice').textContent=`Preview sent ${total} occurrence(s) to the virtual track. Not real arrivals.`};
$('schLookahead').onchange=()=>updateSummary(preview?.at||Date.now());
$('schCameraBtn').onclick=()=>{const on=$('camera').classList.toggle('expanded');$('cameraOverlay').classList.toggle('expanded',on);$('schCameraBtn').classList.toggle('expanded',on);$('schCameraBtn').textContent=on?'Shrink camera':'Expand camera'};
function download(name,contents,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([contents],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
$('schExport').onclick=()=>download('situational_calendar_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({version:50,exported:new Date().toISOString(),events:entries},null,2),'application/json');
function unfold(t){return t.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'')}
function parseIcsDate(v){if(!v)return NaN;const m=v.match(/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?/);if(!m)return NaN;const [_,y,mo,d,h='00',mi='00',sec='00',z]=m;return z?Date.UTC(+y,+mo-1,+d,+h,+mi,+sec):new Date(+y,+mo-1,+d,+h,+mi,+sec).getTime()}
function parseICS(text){const events=unfold(text).split(/BEGIN:VEVENT/i).slice(1),out=[],dow={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};for(const raw of events.slice(0,10000)){const block=raw.split(/END:VEVENT/i)[0],lines=block.split(/\r?\n/),get=name=>{const l=lines.find(x=>x.toUpperCase().startsWith(name));return l?.slice(l.indexOf(':')+1).trim()||''};const label=get('SUMMARY').replace(/\\[,;nN]/g,' ').slice(0,90),when=parseIcsDate(get('DTSTART')),rule=get('RRULE'),repeat=/FREQ=WEEKLY/i.test(rule)?'weekly':'none',by=rule.match(/BYDAY=([A-Z,]+)/i),days=by?by[1].split(',').map(x=>dow[x]).filter(x=>x!==undefined):[new Date(when).getDay()];if(label&&Number.isFinite(when))out.push({id:id(),label,type:'opportunity',value:null,when,repeat,days,source:'ics-import',created:new Date().toISOString()})}return out}
function parseCSV(input){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){const ch=input[i];if(quoted){if(ch==='"'&&input[i+1]==='"'){cell+='"';i++}else if(ch==='"')quoted=false;else cell+=ch}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=''}else cell+=ch}
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(!rows.length)return [];
 const norm=s=>s.toLowerCase().trim().replace(/[ _-]+/g,'');
 const head=rows[0].map(norm),known=['title','summary','subject','event','name','start','startdate','starttime','date','datetime','when'];
 const hasHeader=head.some(x=>known.includes(x));
 const names=hasHeader?head:['title','start','end','type','value','repeat','days'];
 const data=hasHeader?rows.slice(1):rows;
 const field=(r,...keys)=>{for(const key of keys){const i=names.indexOf(key);if(i>=0&&r[i]!==undefined&&r[i].trim())return r[i].trim()}return ''};
 const parseWhen=v=>{if(!v)return NaN;const ms=Date.parse(v);if(Number.isFinite(ms))return ms;if(/^\d{8}(T\d{6}Z?)?$/.test(v))return parseIcsDate(v);return NaN};
 const dayMap={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
 const out=[];
 for(const r of data.slice(0,12000)){
 const label=field(r,'title','summary','subject','event','name','label').slice(0,90);
 let start=field(r,'start','startdate','starttime','datetime','when','date');
 if(!start)continue;
 const time=field(r,'time');if(time&&!/\d\d:\d\d/.test(start))start+=' '+time;
 const when=parseWhen(start),rawType=field(r,'type','category','classification').toLowerCase(),type=color[rawType]?rawType:'opportunity';
 const val=field(r,'value','price','amount','cost');let value=val===''?null:Number(val.replace(/[$,]/g,''));if(value!==null&&!Number.isFinite(value))value=null;
 const repeat=/week/i.test(field(r,'repeat','recurrence','frequency'))?'weekly':'none';
 const ds=field(r,'days','weekdays','byday').toLowerCase().split(/[;|, ]+/).map(x=>dayMap[x.slice(0,3)]).filter(x=>x!==undefined);
 if(label&&Number.isFinite(when))out.push({id:id(),label,type,value,when,repeat,days:ds.length?ds:[new Date(when).getDay()],source:'csv-import',created:new Date().toISOString()})
 }
 return out
}
function parseJSON(text){const o=JSON.parse(text),arr=Array.isArray(o)?o:o.events||[];if(!Array.isArray(arr))throw Error('JSON must contain an events array');return arr.filter(x=>x&&x.label&&Number.isFinite(Number(x.when))).slice(0,12000).map(x=>({...x,id:id(),when:Number(x.when),value:x.value==null?null:Number(x.value),type:color[x.type]?x.type:'opportunity',repeat:x.repeat==='weekly'?'weekly':'none',days:Array.isArray(x.days)?x.days:[],source:'json-import'}))}
$('schImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{
 const ext=file.name.split('.').pop().toLowerCase(),text=await file.text();let arr=[];
 if(ext==='csv')arr=parseCSV(text);
 else if(ext==='ics')arr=parseICS(text);
 else if(ext==='json')arr=parseJSON(text);
 else if(ext==='icbu'){
 // iCal backup bundles are generally not a directly readable text calendar.
 // Accept only backups whose selected file actually contains standard VEVENT text.
 if(!/BEGIN:VCALENDAR/i.test(text)||!/BEGIN:VEVENT/i.test(text))throw Error('.icbu is an Apple Calendar backup, not an ICS file. Export a calendar as .ics, or convert the backup to .ics before importing.');
 arr=parseICS(text)
 }else throw Error('Choose an .ics, .csv, .json or .icbu file.');
 if(!arr.length)throw Error('No valid dated events found. Check CSV column names or calendar export.');
 entries.push(...arr.slice(0,10000));entries=entries.slice(-12000);save();renderList();updateSummary(Date.now());
 $('schNotice').textContent=`Imported ${arr.length} event(s) from ${file.name}. Check dates and recurring events before relying on them.`;
 }catch(err){$('schNotice').textContent='Import failed: '+err.message}e.target.value=''};
// An independent calendar orbit on the existing main stage, behind the camera and controls.
const stage=$('stage'),canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';stage.append(canvas);const c=canvas.getContext('2d');let prevDraw=0;
function draw(t){if(t-prevDraw<90){requestAnimationFrame(draw);return}prevDraw=t;c.clearRect(0,0,960,720);const mode=document.querySelector('#toolbar button.active')?.dataset.view||'perspective';const at=preview?.at||Date.now(),to=at+horizon(),cx=480,cy=mode==='overhead'?370:mode==='globe'?350:510;let shown=0;
for(let ring=1;ring<=5;ring++){const rr=35+ring*40;c.beginPath();if(mode==='perspective')c.ellipse(cx,cy,rr,rr*.33,0,0,Math.PI*2);else c.arc(cx,cy,rr,0,Math.PI*2);c.strokeStyle='rgba(128,192,215,.26)';c.lineWidth=1;c.stroke();c.fillStyle='#94b8c8';c.font='12px system-ui';c.fillText(`${Math.round(ring*20)}% horizon`,cx+rr+5,cy+8)}
const max=entries.length>1500?1500:entries.length;for(let i=0;i<max;i++){const e=entries[i],n=occurrence(e,at);if(n===null||n>to)continue;const p=(n-at)/(to-at),angle=(i*2.399963+((t/1000)%360)*.018)%(Math.PI*2),r=30+220*p,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r*(mode==='perspective'?.38:1);c.fillStyle=color[e.type]||color.opportunity;c.beginPath();c.arc(x,y,3.3,0,Math.PI*2);c.fill();if(shown<12){c.font='12px system-ui';c.fillText(e.label.slice(0,17),x+7,y-5);shown++}}
requestAnimationFrame(draw)}requestAnimationFrame(draw);
renderList();updateSummary(Date.now());setInterval(()=>{tick();if(!preview)$('schClock').textContent='LIVE · '+new Date().toLocaleTimeString()},1000);
})();
