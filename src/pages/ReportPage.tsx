import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Check, CircleAlert, Droplets, ImagePlus, LocateFixed, MapPin, OctagonAlert, ShieldAlert, Trash2, TriangleAlert, Upload, X } from 'lucide-react'
import { LocationPicker } from '../components/LocationPicker'
import { Button, Card } from '../components/ui'
import { useReporter } from '../context/ReporterContext'
import type { Hazard } from '../data/mockData'

type Photo={file:File;url:string}
const categories:{value:Hazard;label:string;Icon:typeof Camera}[]=[
 {value:'pothole',label:'Pothole',Icon:OctagonAlert},{value:'surface water',label:'Waterlogging / standing water',Icon:Droplets},
 {value:'crack',label:'Road crack',Icon:TriangleAlert},{value:'debris',label:'Debris on road',Icon:ShieldAlert},
 {value:'broken manhole cover',label:'Broken manhole cover',Icon:CircleAlert},{value:'missing road sign',label:'Missing road sign',Icon:MapPin},
 {value:'other',label:'Other',Icon:ImagePlus},
]
const allowed=['image/jpeg','image/png','image/webp']

export default function ReportPage(){
 const {submitReport}=useReporter()
 const [step,setStep]=useState(1),[photos,setPhotos]=useState<Photo[]>([]),[uploadError,setUploadError]=useState('')
 const [lat,setLat]=useState(18.512),[lng,setLng]=useState(73.857),[locationState,setLocationState]=useState<'idle'|'finding'|'found'|'denied'>('idle')
 const [category,setCategory]=useState<Hazard|null>(null),[reference,setReference]=useState(''),[submitError,setSubmitError]=useState(''),[submitting,setSubmitting]=useState(false)
 const requested=useRef(false)
 useEffect(()=>()=>photos.forEach(photo=>URL.revokeObjectURL(photo.url)),[])
 useEffect(()=>{
  if(step!==2||requested.current)return
  requested.current=true;setLocationState('finding')
  if(!navigator.geolocation){setLocationState('denied');return}
  navigator.geolocation.getCurrentPosition(position=>{setLat(position.coords.latitude);setLng(position.coords.longitude);setLocationState('found')},()=>setLocationState('denied'),{enableHighAccuracy:true,timeout:8000})
 },[step])
 const addPhotos=(event:ChangeEvent<HTMLInputElement>)=>{
  const files=Array.from(event.target.files||[])
  setUploadError('')
  const next:Photo[]=[]
  for(const file of files){
   if(!allowed.includes(file.type)){setUploadError('Only JPG, PNG, or WebP images can be added.');continue}
   if(file.size>10*1024*1024){setUploadError('Each photo must be 10MB or smaller.');continue}
   if(photos.length+next.length>=3){setUploadError('You can add up to 3 photos.');break}
   next.push({file,url:URL.createObjectURL(file)})
  }
  setPhotos(current=>[...current,...next]);event.target.value=''
 }
 const removePhoto=(index:number)=>setPhotos(current=>current.filter((photo,i)=>{if(i===index)URL.revokeObjectURL(photo.url);return i!==index}))
 const submit=async()=>{
  if(!category)return
  setSubmitting(true);setSubmitError('')
  try{setReference(await submitReport({photos:photos.map(photo=>photo.url),category,lat,lng}))}
  catch(error){setSubmitError(error instanceof Error?error.message:'Report could not be sent. Please try again.')}
  finally{setSubmitting(false)}
 }
 const restart=()=>{photos.forEach(photo=>URL.revokeObjectURL(photo.url));setPhotos([]);setCategory(null);setReference('');setStep(1);setUploadError('');setSubmitError('');requested.current=false}
 if(reference)return <Card className="report-confirmation"><span className="confirmation-icon"><Check/></span><h1>Report received. Thank you.</h1><p>Your reference ID is <strong>{reference}</strong>.</p><Button onClick={restart}>Report another</Button></Card>
 return <>
  <header className="report-heading"><p className="eyebrow">Municipal road reporting</p><h1>Report a road inconvenience</h1><p>Send a photo and location to help the road maintenance team respond.</p></header>
  <ol className="report-steps" aria-label={`Step ${step} of 4`}>
   {['Photos','Location','Category','Review'].map((label,index)=><li className={index+1===step?'active':index+1<step?'complete':''} key={label}><span>{index+1<step?<Check/>:index+1}</span><small>{label}</small></li>)}
  </ol>
  <Card className="report-card">
   {step===1&&<section><h2>Step 1: Add photos</h2><p>Add 1 to 3 clear images of the pothole or road inconvenience.</p><div className="photo-actions"><label className="report-action"><Camera/>Take photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={addPhotos}/></label><label className="report-action secondary"><Upload/>Upload from gallery<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos}/></label></div><p className="field-note">JPG, PNG or WebP · maximum 10MB each</p><div className="upload-message" aria-live="polite">{uploadError}</div>{photos.length>0&&<div className="photo-grid">{photos.map((photo,index)=><div key={photo.url}><img src={photo.url} alt={`Selected road photo ${index+1}`}/><Button className="remove-photo" onClick={()=>removePhoto(index)} aria-label={`Remove photo ${index+1}`}><Trash2/></Button></div>)}</div>}</section>}
   {step===2&&<section><h2>Step 2: Confirm location</h2><p>Location permission places the report accurately so crews can find the road issue. Your location is used only for this report.</p><div className="location-status"><LocateFixed/><span><b>{locationState==='finding'?'Finding your location…':locationState==='found'?'Location detected':'Choose the location on the map'}</b><small>{lat.toFixed(5)}, {lng.toFixed(5)}</small></span></div>{locationState==='denied'&&<><div className="inline-notice"><CircleAlert/>Location access was unavailable. Drag the pin or tap the map to set the location.</div><LocationPicker lat={lat} lng={lng} onChange={(a,b)=>{setLat(a);setLng(b)}}/></>}</section>}
   {step===3&&<section><h2>Step 3: Choose a category</h2><p>Select the option that best matches the road inconvenience.</p><div className="category-grid">{categories.map(({value,label,Icon})=><button type="button" className={category===value?'selected':''} aria-pressed={category===value} onClick={()=>setCategory(value)} key={value}><Icon/><span>{label}</span>{category===value&&<Check/>}</button>)}</div></section>}
   {step===4&&<section><h2>Step 4: Review and submit</h2><div className="review-row"><span>Photos</span><b>{photos.length} attached</b></div><div className="review-thumbs">{photos.map((photo,index)=><img src={photo.url} alt={`Road photo ${index+1}`} key={photo.url}/>)}</div><div className="review-row"><span>Category</span><b>{categories.find(item=>item.value===category)?.label}</b></div><div className="review-row"><span>Location</span><b>{lat.toFixed(5)}, {lng.toFixed(5)}</b></div><div className="privacy-note"><ShieldAlert/>Photos may be reviewed by municipal staff. Avoid capturing faces or number plates.</div><div className="upload-message" aria-live="polite">{submitError}</div><Button className="submit-report" onClick={submit} disabled={submitting}>{submitting?'Sending report…':'Submit report'}</Button></section>}
   <div className="report-nav">{step>1&&<Button className="ghost" onClick={()=>setStep(step-1)}>Back</Button>}{step<4&&<Button onClick={()=>setStep(step+1)} disabled={(step===1&&photos.length===0)||(step===3&&!category)}>Continue</Button>}</div>
  </Card>
 </>
}
