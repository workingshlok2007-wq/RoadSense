import { HardHat, ShieldCheck } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'

export default function PublicShell(){
 const message=(useLocation().state as {message?:string}|null)?.message
 return <div className="report-page"><a className="skip" href="#report-main">Skip to form</a><header className="public-shell-head"><div className="report-brand"><span>RS</span><div><b>Report a road problem</b><small>RoadSense citizen portal</small></div></div><div className="staff-login-links" aria-label="Staff access"><Link to="/login/operator"><ShieldCheck/>Operator sign in</Link><Link to="/login/crew"><HardHat/>Crew sign in</Link></div></header><main id="report-main">{message&&<div className="role-message" role="alert">{message}</div>}<Outlet/></main><footer><strong>Simulated demo data</strong> · Your report is sent securely to the municipal road team.</footer></div>
}
