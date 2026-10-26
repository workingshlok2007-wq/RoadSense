import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useDemo } from './DemoContext'
import type { Hazard, Report } from '../data/mockData'
import { api } from '../services/api'

type Submission = { photos:string[]; category:Hazard; lat:number; lng:number }
type ReporterContextValue = { submitReport:(submission:Submission)=>Promise<string> }
const ReporterContext=createContext<ReporterContextValue|null>(null)

const distanceInMeters=(a:{lat:number;lng:number},b:{lat:number;lng:number})=>{
 const earth=6371e3, p1=a.lat*Math.PI/180, p2=b.lat*Math.PI/180
 const dp=(b.lat-a.lat)*Math.PI/180, dl=(b.lng-a.lng)*Math.PI/180
 const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
 return earth*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))
}

export function ReporterProvider({children}:{children:ReactNode}){
 const {reports,add}=useDemo()
 const recentSubmissions=useRef<number[]>([])
 const submitReport=async({photos,category,lat,lng}:Submission)=>{
  const now=Date.now()
  recentSubmissions.current=recentSubmissions.current.filter(time=>now-time<60000)
  if(recentSubmissions.current.length>=3) throw new Error('Please wait a minute before sending another report.')
  const nearby=reports.find(report=>distanceInMeters({lat,lng},report)<=10)
  const id=`RS-${Math.floor(3000+Math.random()*6000)}`
  const report:Report={id,lat,lng,severity:'Medium',hazardType:category,status:'Reported',confidence:75,district:'Central',reportedAt:new Date(now).toISOString(),slaDeadline:new Date(now+72*3600000).toISOString(),duplicates:nearby?nearby.duplicates+1:1,clusterId:nearby?.clusterId||`C-${id}`,priority:nearby?Math.min(100,nearby.priority+8):68,photo:photos[0]}
  await api.submitReport(report)
  add(report)
  recentSubmissions.current.push(now)
  return id
 }
 return <ReporterContext.Provider value={{submitReport}}>{children}</ReporterContext.Provider>
}

export const useReporter=()=>{
 const value=useContext(ReporterContext)
 if(!value) throw Error('Reporter context missing')
 return value
}
