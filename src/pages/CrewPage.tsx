import { useState } from 'react'
import { Camera, CheckCircle2, MapPin, Navigation, RotateCcw } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { Badge, Button, Card, Heading } from '../components/ui'
export default function CrewPage(){
 const {reports,update}=useDemo();const task=reports.find(r=>r.status!=='Resolved')||reports[0]
 const [photo1,setP1]=useState(false),[photo2,setP2]=useState(false),[severity,setSeverity]=useState(''),[error,setError]=useState(false),[authorized,setAuthorized]=useState(false)
 const ready=photo1&&photo2&&severity
 const upload=(which:1|2)=>{if(which===2&&!error){setError(true);return}which===1?setP1(true):setP2(true)}
 const auth=()=>{setAuthorized(true);update(task.id,{status:'Crew Dispatched'})}
 return <><Heading sub="Guided, evidence-based verification for municipal field teams">Field crew simulator</Heading><div className="crew-layout"><Card><h2>Why two-step verification?</h2><p>Road crews must capture both site context and a close-up measurement photo before heavy equipment can be authorized.</p><div className="compliance"><CheckCircle2/>Chain-of-custody evidence is shared with Operations and the Triage queue instantly.</div></Card>
 <div className="phone"><div className="phone-top"><span>09:42</span><b>RoadSense Crew</b><Badge tone="success">Online</Badge></div><div className="phone-body"><div className="spread"><div><small>Priority task</small><h2>{task?.id}</h2></div><Badge tone="high">High</Badge></div><div className="address"><MapPin/><span><b>Market Avenue, Central</b><small>Outside Civic Arcade · 0.4 km</small></span></div><Button className="nav-btn"><Navigation/> Start navigation</Button>
 <div className="verify"><h3>1. On-site context photo</h3><p>Show the hazard and surrounding carriageway.</p><Button className={photo1?'done-btn':'upload-btn'} onClick={()=>upload(1)}><Camera/>{photo1?'Photo captured':'Capture photo'}</Button></div>
 <div className="verify"><h3>2. Secondary verification</h3><p>Close-up with depth and width reference.</p>{error&&!photo2?<div className="upload-error"><b>Upload interrupted</b><span>Check connection, then retry.</span><Button onClick={()=>{setError(false);setP2(true)}}><RotateCcw/>Retry</Button></div>:<Button className={photo2?'done-btn':'upload-btn'} onClick={()=>upload(2)}><Camera/>{photo2?'Verification photo added':'Add second photo'}</Button>}
 <label>Severity decision<select value={severity} onChange={e=>setSeverity(e.target.value)}><option value="">Select required decision</option><option>Confirm</option><option>Upgrade</option><option>Downgrade</option></select></label><div className="measure"><label>Depth (mm)<input type="number" defaultValue="42"/></label><label>Width (cm)<input type="number" defaultValue="68"/></label></div></div>
 {!ready&&<p className="disabled-reason">Add both required photos and confirm severity to authorize equipment.</p>}<Button className="authorize" disabled={!ready||authorized} onClick={auth}>{authorized?'Equipment authorized':'Authorize heavy equipment'}</Button>
 {authorized&&<Button className="repair" onClick={()=>update(task.id,{status:'Resolved'})}><CheckCircle2/> Add after-repair photo & resolve</Button>}</div></div></div></>
}
