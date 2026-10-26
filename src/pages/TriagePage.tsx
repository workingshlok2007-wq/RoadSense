import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, GitMerge, Pause, Play, Zap } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useSearchParams } from 'react-router'
import { useDemo } from '../context/DemoContext'
import { Badge, Button, Card, Heading } from '../components/ui'
import { leaderboard, type Report } from '../data/mockData'

const trend=[48,42,31,24,18,12,8,4.2].map((value,index)=>({day:index+1,value}))
const steps=['Reported','Verified','Crew Dispatched','Resolved']

export default function TriagePage(){
 const {reports}=useDemo()
 const [searchParams,setSearchParams]=useSearchParams()
 const [merged,setMerged]=useState(false),[table,setTable]=useState(false),[paused,setPaused]=useState(false),[tick,setTick]=useState(0)
 const tab=searchParams.get('tab')==='sla'?'sla':'triage'
 const [weights,setWeights]=useState({severity:40,duplicates:25,business:20,sla:15})
 useEffect(()=>{if(paused)return;const timer=setInterval(()=>setTick(value=>value+1),2200);return()=>clearInterval(timer)},[paused])
 const ranked=useMemo(()=>reports.slice(0,8).map(report=>({...report,score:Math.round(report.priority*(weights.severity/40)+report.duplicates*(weights.duplicates/10))})).sort((a,b)=>b.score-a.score),[reports,weights])
 return <><Heading sub="Explainable automation with a human always in the loop">AI pipeline & triage</Heading>
  <div className="page-tabs" role="tablist" aria-label="Triage views"><button role="tab" aria-selected={tab==='triage'} onClick={()=>setSearchParams({})}>Triage operations</button><button role="tab" aria-selected={tab==='sla'} onClick={()=>setSearchParams({tab:'sla'})}>SLA &amp; Accountability</button></div>
  {tab==='triage'?<>
   <div className="pipeline">{['Ingest','Vision classification','Spatial dedup','Severity scoring','Auto-triage','Dispatch'].map((label,index)=><div key={label}><span>{index+1}</span><b>{label}</b><small>{Math.max(8,reports.length-index*7)} live</small></div>)}</div>
   <div className="kpis"><Card><span>Spatial deduplication</span><b>91.4%</b><small>↑ 18.2% this quarter</small></Card><Card><span>Triage time</span><b>4.2 min</b><small>Was 48–72 hours</small></Card><Card><span>Repair resolution</span><b>84.6%</b><small>Was 42.0%</small></Card></div>
   <div className="grid-2"><Card><div className="spread"><div><b>Triage time trend</b><p>Median hours to verified decision</p></div><Button className="ghost" onClick={()=>setTable(!table)}>View as {table?'chart':'table'}</Button></div>{table?<table><thead><tr><th>Period</th><th>Hours</th></tr></thead><tbody>{trend.map(point=><tr key={point.day}><td>Week {point.day}</td><td>{point.value}</td></tr>)}</tbody></table>:<div className="chart" aria-label="Triage time decreased from 48 to 4.2 hours"><ResponsiveContainer><AreaChart data={trend}><Tooltip/><Area dataKey="value" stroke="#1D4ED8" fill="#DBEAFE"/></AreaChart></ResponsiveContainer></div>}</Card>
    <Card className="dedup"><GitMerge/><div><b>Spatial deduplication demo</b><p>Drop ten complaints within a 10-meter radius.</p><Button onClick={()=>setMerged(false)||setTimeout(()=>setMerged(true),500)}><Zap/> Simulate 10 duplicate complaints</Button></div>{merged&&<Badge tone="success">10 complaints → 1 work order</Badge>}</Card></div>
   <div className="triage-grid"><Card><h2>Priority weight controls</h2><p className="muted">Score = severity + duplicates + corridor impact + SLA age. Increase a factor to move its urgent tickets up.</p>{Object.entries(weights).map(([key,value])=><label className="slider" key={key}><span>{key}<b>{value}%</b></span><input type="range" min="0" max="50" value={value} onChange={event=>setWeights({...weights,[key]:+event.target.value})}/></label>)}</Card><Card><h2>Ranked triage queue</h2>{ranked.slice(0,5).map((report,index)=><div className="queue" key={report.id}><b>#{index+1}</b><span><strong>{report.id} · {report.hazardType}</strong><small>{report.district} · {report.duplicates} linked reports</small></span><Badge tone={report.severity.toLowerCase()}>{report.score}</Badge></div>)}</Card>
    <Card><div className="spread"><h2>Live telemetry</h2><Button className="icon" onClick={()=>setPaused(!paused)} aria-label={paused?'Resume feed':'Pause feed'}>{paused?<Play/>:<Pause/>}</Button></div><div className="telemetry" aria-live="polite">{Array.from({length:7},(_,index)=><p key={index+tick}><Activity/><span><b>{index%3===0?'Duplicate merged':index%3===1?'Report verified':'Dispatch updated'}</b><small>{index+1} min ago · RS-{2420+(tick+index)%40}</small></span></p>)}</div></Card></div>
  </>:<SlaAccountability reports={reports}/>}</>
}

function SlaAccountability({reports}:{reports:Report[]}){
 return <div className="sla-view"><Card><div className="spread"><div><h2>Ticket status and SLA</h2><p>Operator view of active repair commitments by severity.</p></div><Badge tone="blue">{reports.filter(report=>report.status!=='Resolved').length} active</Badge></div>
  <div className="sla-tickets">{reports.slice(0,8).map(report=>{
   const current=steps.indexOf(report.status),left=Math.round((new Date(report.slaDeadline).getTime()-Date.now())/3600000)
   const state=left<0?'Breached':left<8?'At risk':'On track',StateIcon=state==='On track'?CheckCircle2:state==='At risk'?Clock3:AlertTriangle
   return <article className="sla-ticket" key={report.id}><div className="spread"><div><b>{report.id}</b><p>{report.hazardType} · {report.district} district</p></div><Badge tone={state==='On track'?'success':state==='At risk'?'medium':'high'}><StateIcon/>{state} · {Math.abs(left)}h {left<0?'over':'left'}</Badge></div><div className="stepper">{steps.map((status,index)=><div className={index<=current?'done':''} key={status}><CheckCircle2/><small>{status}</small><time>{index<=current?new Date(new Date(report.reportedAt).getTime()+index*3600000).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'Pending'}</time></div>)}</div></article>
  })}</div></Card>
  <Card><h2>Accountability leaderboard</h2><p>District and contractor performance against municipal repair SLAs.</p><div className="table-wrap"><table><thead><tr><th>District</th><th>Contractor</th><th>On-time</th><th>Avg. resolution</th><th>Breached SLAs</th></tr></thead><tbody>{leaderboard.map(row=><tr key={row.district}><td><b>{row.district}</b></td><td>{row.contractor}</td><td>{row.onTime}%</td><td>{row.average}</td><td>{row.breached}</td></tr>)}</tbody></table></div></Card>
 </div>
}
