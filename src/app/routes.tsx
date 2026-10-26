import { createBrowserRouter, Navigate } from 'react-router'
import AppShell from '../components/AppShell'
import CrewShell from '../components/CrewShell'
import PublicShell from '../components/PublicShell'
import RoleGuard from '../components/RoleGuard'
import { ReporterProvider } from '../context/ReporterContext'
import AccessibilityPage from '../pages/AccessibilityPage'
import CorridorsPage from '../pages/CorridorsPage'
import CrewLoginPage from '../pages/CrewLoginPage'
import CrewPage from '../pages/CrewPage'
import MapPage from '../pages/MapPage'
import OperatorLoginPage from '../pages/OperatorLoginPage'
import ReportPage from '../pages/ReportPage'
import TriagePage from '../pages/TriagePage'

export const router=createBrowserRouter([
 {path:'/login/operator',Component:OperatorLoginPage},
 {path:'/login/crew',Component:CrewLoginPage},
 {path:'/login/public',element:<Navigate to="/" replace/>},
 {Component:PublicShell,children:[
  {path:'/',element:<ReporterProvider><ReportPage/></ReporterProvider>},
  {path:'/report',element:<ReporterProvider><ReportPage/></ReporterProvider>},
 ]},
 {element:<RoleGuard role="operator"/>,children:[{Component:AppShell,children:[
  {path:'/map',Component:MapPage},{path:'/triage',Component:TriagePage},{path:'/corridors',Component:CorridorsPage},{path:'/accessibility',Component:AccessibilityPage},
 ]}]},
 {element:<RoleGuard role="crew"/>,children:[{Component:CrewShell,children:[
  {path:'/crew',Component:CrewPage},
 ]}]},
 {path:'*',element:<Navigate to="/" replace/>},
])
