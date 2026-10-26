import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { reports as seed, type Report } from '../data/mockData'
import { api } from '../services/api'
type Ctx={reports:Report[];loading:boolean;error:string;weather:boolean;setWeather:(v:boolean)=>void;update:(id:string,p:Partial<Report>)=>void;add:(p:Report)=>void;reset:()=>void}
const DemoContext=createContext<Ctx|null>(null)
export function DemoProvider({children}:{children:ReactNode}){
 const [reports,setReports]=useState<Report[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[weather,setWeather]=useState(false)
 useEffect(()=>{api.getReports().then(setReports).catch(()=>setError('Demo data could not be loaded.')).finally(()=>setLoading(false))},[])
 const update=(id:string,p:Partial<Report>)=>setReports(r=>r.map(x=>x.id===id?{...x,...p}:x))
 return <DemoContext.Provider value={{reports,loading,error,weather,setWeather,update,add:p=>setReports(r=>[p,...r]),reset:()=>setReports(structuredClone(seed))}}>{children}</DemoContext.Provider>
}
export const useDemo=()=>{const v=useContext(DemoContext);if(!v)throw Error('Demo context missing');return v}
