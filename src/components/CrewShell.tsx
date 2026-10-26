import { Camera, ClipboardList, LogOut, UserRound } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui'

export default function CrewShell(){
 const {auth,logout}=useAuth(),navigate=useNavigate()
 const signOut=()=>{logout();navigate('/')}
 return <div className="crew-app-shell"><header><div className="brand"><span>RS</span><div><b>RoadSense Crew</b><small>{auth?.userName}</small></div></div><Button className="ghost" onClick={signOut}><LogOut/>Logout</Button></header><main id="main"><Outlet/></main><nav className="crew-bottom-nav" aria-label="Field crew navigation"><a className="active" href="#main"><ClipboardList/>Tasks</a><a href="#main"><Camera/>Camera</a><a href="#crew-profile"><UserRound/>Profile</a></nav></div>
}
