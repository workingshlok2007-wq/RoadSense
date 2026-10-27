import { useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import {
  Accessibility,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LogOut,
  Map,
  Menu,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react"
import { Button } from "./ui"
import { useDemo } from "../context/DemoContext"
import { useAuth } from "../context/AuthContext"

const nav = [
  [Map, "Operations map", "/map"],
  [BrainCircuit, "AI triage", "/triage"],
  [Clock3, "SLA & Accountability", "/triage?tab=sla"],
  [Building2, "Corridors", "/corridors"],
] as const
export default function AppShell() {
  const [open, setOpen] = useState(false),
    [walk, setWalk] = useState(false),
    [profile, setProfile] = useState(false)
  const { reset } = useDemo(),
    { auth, logout } = useAuth(),
    navigate = useNavigate(),
    location = useLocation()
  const signOut = () => {
    logout()
    navigate("/")
  }
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className={open ? "open" : ""}>
        <div className="brand">
          <span>RS</span>
          <div>
            <b>RoadSense</b>
            <small>Municipal command</small>
          </div>
          <Button
            className="icon mobile"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </Button>
        </div>
        <nav>
          {nav.map(([Icon, label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive &&
                (to.includes("?")
                  ? location.search === "?tab=sla"
                  : to === "/triage"
                    ? location.search !== "?tab=sla"
                    : true)
                  ? "active"
                  : ""
              }
              onClick={() => setOpen(false)}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-actions">
          <NavLink to="/accessibility">
            <Accessibility />
            Accessibility
          </NavLink>
          <Button onClick={() => setWalk(true)}>Demo walkthrough</Button>
          <Button className="ghost" onClick={reset}>
            <RotateCcw /> Reset demo
          </Button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Button
            className="icon mobile"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <div className="status">
            <i /> Systems operational
          </div>
          <div className="profile-wrap">
            <button
              className="profile-button"
              onClick={() => setProfile(!profile)}
              aria-expanded={profile}
            >
              <UserRound />
              <span>
                <b>{auth?.userName}</b>
                <small>Operator account</small>
              </span>
              <ChevronDown />
            </button>
            {profile && (
              <div className="profile-menu">
                <Button className="ghost" onClick={signOut}>
                  <LogOut />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <footer>
          RoadSense civic prototype · <strong>Simulated demo data</strong> ·
          OpenStreetMap contributors
        </footer>
      </div>
      {walk && (
        <div className="modal-backdrop" onClick={() => setWalk(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="walk-title"
            onClick={(event) => event.stopPropagation()}
          >
            <Button className="icon close" onClick={() => setWalk(false)}>
              <X />
            </Button>
            <p className="eyebrow">Demo walkthrough</p>
            <h2 id="walk-title">Start from the role selection page</h2>
            {[
              "Citizen: any 10-digit phone, OTP 123456",
              "Operator: operator@roadsense.gov / Operator@123",
              "Field Crew: CREW-017 / PIN 4821",
              "Citizen submits a photo; operator sees it in triage",
              "Crew verifies the repair; operator closes it",
            ].map((item, index) => (
              <p className="walk" key={item}>
                <CheckCircle2 />
                <b>{index + 1}</b>
                {item}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
