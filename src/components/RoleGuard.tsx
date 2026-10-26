import { Navigate, Outlet } from 'react-router'
import { useAuth, type Role } from '../context/AuthContext'

export default function RoleGuard({role}:{role:Role}){
 const {auth}=useAuth()
 if(auth?.role!==role)return <Navigate to="/" replace state={{message:`This area is for ${role} accounts.`}}/>
 return <Outlet/>
}
