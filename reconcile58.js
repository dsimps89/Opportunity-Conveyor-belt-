(()=>{'use strict';
const status=document.getElementById('v58status'),details=document.getElementById('v58details');
let latest=null;
function show(){if(!latest)return;const {matches,total,threshold,sourceCount,scheduledCount}=latest;
status.firstChild.nextSibling.textContent=` · ${matches.length} matched of ${total} actual records (${sourceCount} feed, ${scheduledCount} scheduled).`;
const next=matches[0];details.textContent=next?`Closest matching event: ${next.title} · ${next.points}% relevance · ${next.value==null?'price not supplied':'entered $'+Number(next.value).toFixed(2)} · ${next.distance==null?'geographic distance unknown':Math.round(next.distance)+' m'} · source: ${next.source}. Virtual animation progress is NOT the relevance score.`:`No qualifying record. Check categories, keywords, time horizon, minimum relevance (${threshold}%), and distance filter. A moving virtual marker alone does not constitute a matched event. $ values are separate from the 0–100 relevance score.`;
}
window.addEventListener('sg-watch-results',e=>{latest=e.detail;show()});
document.getElementById('v58scan').onclick=()=>{document.getElementById('watchApply')?.click();if(!latest)details.textContent='Open Opportunity Watch to configure the scan and connect a community feed.'};
document.getElementById('v58flip').onclick=()=>{document.getElementById('wbFlip')?.click();details.textContent='Virtual track direction flipped. This does not change compass heading or actual coordinates.'};
window.addEventListener('sg-feed-updated',e=>{const n=e.detail?.items?.length||0;status.title=`Feed refreshed: ${n} items`;document.getElementById('watchApply')?.click()});
})();