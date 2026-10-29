(()=>{'use strict';
const $=id=>document.getElementById(id), KEY='sg54_watch_prefs',SAVED='sg54_interested',SEEN='sg54_seen';
const allowed=['opportunity','risk','weather','community','commerce','task'];let feed=[],saved=[],seen={},prefs={};
function get(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(e){return fallback}}
function put(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){status('Local save unavailable: '+e.message)}}
saved=get(SAVED,[]);seen=get(SEEN,{});prefs=get(KEY,{});
for(const id of ['watchKeywords','watchWindow','watchThreshold','watchRadius','watchExpiry'])if(prefs[id]!==undefined)$(id).value=prefs[id];
if(Array.isArray(prefs.categories))for(const o of $('watchCategory').options)o.selected=prefs.categories.includes(o.value);
const stamp=()=>new Date().toISOString();
function evidence(kind,description){window.SGLog?.(kind,description);try{const key='sg54_evidence';const history=get(key,[]);history.unshift({utc:stamp(),kind,description});put(key,history.slice(0,1000))}catch(e){}}
function status(t){$('watchStatus').textContent=t}
function settings(){return {keywords:$('watchKeywords').value.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean),categories:[...$('watchCategory').selectedOptions].map(o=>o.value),windowMs:Number($('watchWindow').value)*3600000,threshold:Number($('watchThreshold').value),radius:$('watchRadius').value,expiry:Number($('watchExpiry').value)*3600000}}
function savePrefs(){const x={};for(const id of ['watchKeywords','watchWindow','watchThreshold','watchRadius','watchExpiry'])x[id]=$(id).value;x.categories=[...$('watchCategory').selectedOptions].map(o=>o.value);put(KEY,x)}
function key(e){return `${e.source}:${e.id||e.title+'-'+e.when}`}
function norm(e,source){return {id:String(e.id||''),title:String(e.title||e.label||'Untitled').slice(0,140),category:allowed.includes(e.category||e.type)?(e.category||e.type):'opportunity',when:Number(e.when),value:e.value==null?null:Number(e.value),source,lat:e.lat==null?null:Number(e.lat),lon:e.lon==null?null:Number(e.lon),repeat:e.repeat||'none',days:e.days||[]}}
function upcoming(e,now){if(e.repeat!=='weekly')return e.when;const base=new Date(e.when),hour=base.getHours(),min=base.getMinutes(),days=e.days||[];let d=new Date(Math.max(now,e.when));d.setHours(hour,min,0,0);if(d.getTime()<now)d.setDate(d.getDate()+1);for(let i=0;i<9;i++){if(days.includes(d.getDay())&&d.getTime()>=e.when)return d.getTime();d.setDate(d.getDate()+1)}return null}
function km(a,b,c,d){const rad=Math.PI/180,dLat=(c-a)*rad,dLon=(d-b)*rad,x=Math.sin(dLat/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(dLon/2)**2;return 12742000*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function score(e,st,now){const due=upcoming(e,now);if(!Number.isFinite(due))return null;if(due>now+st.windowMs||due<now-st.expiry)return null;if(!st.categories.includes(e.category))return null;
let distance=null;if(st.radius!=='any'){const o=window.SG46?.snapshot?.()?.origin;if(!o||!Number.isFinite(e.lat)||!Number.isFinite(e.lon))return null;distance=km(o.lat,o.lon,e.lat,e.lon);if(!Number.isFinite(distance)||distance>Number(st.radius))return null}
const hits=st.keywords.filter(w=>e.title.toLowerCase().includes(w)||e.category.includes(w));
// Explainable relevance: category 40, keyword 40, time 20. No invented geospatial certainty.
const categoryPoints=40,keywordPoints=st.keywords.length?40*hits.length/st.keywords.length:40,timePoints=20*Math.max(0,1-Math.max(0,due-now)/st.windowMs);const points=Math.round(categoryPoints+keywordPoints+timePoints);
if(points<st.threshold)return null;return {...e,due,points,hits,distance,expiresAt:due+st.expiry}}
function elt(tag,content){const el=document.createElement(tag);if(content!==undefined)el.textContent=content;return el}
function btn(text,fn){const b=elt('button',text);b.onclick=fn;return b}
function format(t){return new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}
function renderCard(e,interest=false){const a=elt('article');a.className='watchcard '+(e.category==='risk'?'watchrisk':'watchopp');a.append(elt('strong',e.title));a.append(elt('p',`${e.category.toUpperCase()} · ${format(e.due||e.when)} · ${e.source}`));a.append(elt('p',`Match ${e.points||'—'}% · ${e.hits?.length?'Keywords: '+e.hits.join(', '):'Category/time match'} · ${e.distance===null||e.distance===undefined?'Distance not verified':(e.distance/1000).toFixed(2)+' km'}`));if(e.value!==null&&Number.isFinite(e.value))a.append(elt('p',`Entered value: $${e.value.toFixed(2)}`));a.append(elt('p',`Expires ${format(e.expiresAt)}`));if(interest)a.append(btn('Remove saved',()=>{saved=saved.filter(x=>x.savedKey!==e.savedKey);put(SAVED,saved);evidence('watch','Removed saved interest: '+e.title);renderSaved()}));else a.append(btn('Interested · save',()=>{const k=key(e);if(!saved.some(x=>x.savedKey===k)){saved.unshift({...e,savedKey:k,savedAt:Date.now()});put(SAVED,saved);evidence('watch','Saved interest: '+e.title+' · '+e.points+'% · expires '+format(e.expiresAt));renderSaved()}}));return a}
function renderSaved(){const now=Date.now(),before=saved.length;saved=saved.filter(e=>Number.isFinite(e.expiresAt)&&e.expiresAt>now);if(saved.length!==before){put(SAVED,saved);evidence('watch','Expired '+(before-saved.length)+' saved interest(s)')}const box=$('watchSaved');box.replaceChildren();for(const e of saved.slice(0,200))box.append(renderCard(e,true));if(!saved.length)box.textContent='No saved interested items. Expired items are removed automatically.'}
window.sgWatchScanNow=()=>scan();let lastFeed='';function scan(){savePrefs();const now=Date.now(),st=settings(),scheduled=(window.sgWatchSchedule?.()||[]).map(x=>norm(x,'scheduled')),items=[...feed,...scheduled];const matches=[];
for(const e of items){const m=score(e,st,now);if(m)matches.push(m)}matches.sort((a,b)=>a.due-b.due||b.points-a.points);
window.dispatchEvent(new CustomEvent('sg-watch-results',{detail:{matches,total:items.length,threshold:st.threshold,sourceCount:feed.length,scheduledCount:scheduled.length}}));
const box=$('watchMatches');box.replaceChildren();for(const m of matches.slice(0,100))box.append(renderCard(m));if(!matches.length)box.textContent='No matches in the selected categories and time window.';
let newCount=0;for(const m of matches){const k=key(m)+':'+m.due;if(seen[k])continue;seen[k]=now;newCount++;evidence('watch',`MATCH ${m.points}% · ${m.title} · ${m.category} · due ${format(m.due)} · source ${m.source} · range ${m.distance===null?'unknown':Math.round(m.distance)+'m'}`);if(newCount<=3&&document.visibilityState==='visible'&&('Notification'in window&&Notification.permission==='granted')){try{new Notification('Opportunity Watch · '+m.points+'%',{body:m.title+' · '+format(m.due),tag:k})}catch(e){}}}
if(newCount)put(SEEN,seen);if(Object.keys(seen).length>4000){seen=Object.fromEntries(Object.entries(seen).sort((a,b)=>b[1]-a[1]).slice(0,1500));put(SEEN,seen)}
renderSaved();status(`${matches.length} matching record(s) · ${newCount} newly matched · scanned ${format(now)} · ${st.radius==='any'?'No distance filter':'Only independently geolocated records'} · Alerts ${('Notification'in window&&Notification.permission==='granted')?'enabled while open':'not enabled'}`)}
$('watchApply').onclick=scan;
$('watchNotify').onclick=async()=>{if(!('Notification'in window)){status('Browser notifications unsupported. On-screen matching still works.');return}if(!window.isSecureContext){status('Notification permission requires HTTPS or a supported secure context.');return}try{const p=await Notification.requestPermission();status('Notification permission: '+p+'. Notifications only while this page is running.');evidence('watch','Notification permission '+p);scan()}catch(e){status('Notification permission failed: '+e.message)}};
window.addEventListener('sg-feed-updated',ev=>{feed=(ev.detail?.items||[]).map(x=>norm(x,'community'));lastFeed=ev.detail?.source||'';scan()});
for(const id of ['watchKeywords','watchWindow','watchThreshold','watchRadius','watchExpiry','watchCategory'])$(id).addEventListener('change',scan);
setInterval(()=>{if($('watchAuto').checked&&!document.hidden)scan()},30000);
setInterval(renderSaved,60000);
scan();
})();