// One owned issue per monitor; unchanged faults do not create repeated comments.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const [reportPath,key]=process.argv.slice(2);
if(!['amazon','good-guys'].includes(key))throw new Error('Unknown monitor');
let report;try{report=JSON.parse(await fs.readFile(reportPath,'utf8'));}catch{report={faults:[{status:'monitor-error',reason:'No current report produced. Inspect the workflow logs.'}]};}
const faults=Array.isArray(report.faults)?report.faults:[{status:'monitor-error',reason:'Invalid report'}];
const marker=`<!-- ahc-availability:${key} -->`;
const signature=crypto.createHash('sha256').update(JSON.stringify(faults.map(f=>({url:f.url,status:f.status,reason:f.reason})))).digest('hex');
const stamp=`<!-- state:${signature} -->`;
const repo=process.env.GITHUB_REPOSITORY;
if(!/^[\w-]+\/[\w.-]+$/.test(repo??''))throw new Error('Missing repository');
const root=`https://api.github.com/repos/${repo}`;
async function api(endpoint,method='GET',body){
 const res=await fetch(root+endpoint,{method,redirect:'error',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
 if(!res.ok)throw new Error(`Issue API failed: HTTP ${res.status}`);
 return res.json();
}
let existing;
for(let page=1;page<=10;page++){
 const issues=await api(`/issues?state=open&per_page=100&page=${page}`);
 existing=issues.find(i=>!i.pull_request&&i.body?.includes(marker));
 if(existing||issues.length<100)break;
 if(page===10)throw new Error('Issue search incomplete; refusing duplicate');
}
if(!faults.length){if(existing)await api(`/issues/${existing.number}`,'PATCH',{state:'closed',state_reason:'completed'});process.exit(0);}
if(existing?.body?.includes(stamp))process.exit(0);
const link=`https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const safe=s=>String(s??'').replace(/[<>\r\n]/g,' ');
const body=`${marker}\n${stamp}\n\n${faults.length} issues need review. [Current report and logs](${link}).\n\n`+faults.map(f=>`- **${safe(f.names?.[0]??f.name??'Monitor')}**: ${safe(f.status)} — ${safe(f.reason)}${f.url?'\n  '+safe(f.url):''}`).join('\n')+'\n\nUnverified access is not proof of unavailable stock. Investigate using clean direct URLs only. Never open affiliate redirects or tagged Amazon URLs. Preserve images; remove buying links only after a confirmed issue. Report artifacts retain low-stock and delayed-dispatch observations too.\n';
const data={title:`Affiliate monitoring: ${key} needs attention`,body};
await api(existing?`/issues/${existing.number}`:'/issues',existing?'PATCH':'POST',data);
