import { useState } from 'react'
import { ArrowLeft, HardHat, KeyRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

export default function CrewLoginPage(){
 const {login}=useAuth(),navigate=useNavigate()
 const [crewId,setCrewId]=useState(''),[pin,setPin]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const submit=(event:React.FormEvent)=>{event.preventDefault();setError('');if(!crewId||pin.length!==4){setError('Enter your Crew ID and 4-digit PIN.');return}setLoading(true);setTimeout(()=>{if(crewId.toUpperCase()==='CREW-017'&&pin==='4821'){login('crew','Crew 017');navigate('/crew')}else{setError('Crew ID or PIN is incorrect.');setLoading(false)}},500)}
 return <div className="login-page crew-login"><main className="mobile-login"><Link className="back-link" to="/"><ArrowLeft/>Back to public reporting</Link><div className="login-icon"><HardHat/></div><p className="eyebrow">RoadSense field operations</p><h1>Crew sign in</h1><p>Access assigned tasks and on-site verification tools.</p><form className="login-form" onSubmit={submit}><label>Crew ID<input autoComplete="username" value={crewId} onChange={event=>setCrewId(event.target.value.toUpperCase())} placeholder="CREW-000"/></label><label>4-digit PIN<div className="pin-field"><KeyRound/><input type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} value={pin} onChange={event=>setPin(event.target.value.replace(/\D/g,''))} placeholder="••••"/></div></label><div className="login-error" aria-live="polite">{error}</div><Button type="submit" disabled={loading}>{loading?'Signing in…':'Open crew app'}</Button></form><div className="demo-hint"><b>Demo:</b> CREW-017 · PIN 4821</div></main></div>
}
