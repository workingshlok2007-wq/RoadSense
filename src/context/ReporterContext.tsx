import { createContext, useContext, useRef, type ReactNode } from "react"
import { useDemo } from "./DemoContext"
import type { Hazard, Report, Severity } from "../data/mockData"
import { api } from "../services/api"

type Submission = {
  photos: string[]
  category: Hazard
  lat: number
  lng: number
  severity?: Severity
  description?: string
}

type ReporterContextValue = {
  submitReport: (submission: Submission) => Promise<string>
}

const ReporterContext = createContext<ReporterContextValue | null>(null)

type GeoPoint = {
  lat: number
  lng: number
}

const distanceInMeters = (a: GeoPoint, b: GeoPoint) => {
  const earth = 6371e3,
    p1 = (a.lat * Math.PI) / 180,
    p2 = (b.lat * Math.PI) / 180
  const dp = ((b.lat - a.lat) * Math.PI) / 180,
    dl = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function ReporterProvider({ children }: { children: ReactNode }) {
  const { reports, add, refresh } = useDemo()
  const recentSubmissions = useRef<number[]>([])

  const submitReport = async ({
    photos,
    category,
    lat,
    lng,
    severity = "Medium",
    description = "",
  }: Submission) => {
    const now = Date.now()
    recentSubmissions.current = recentSubmissions.current.filter(
      (time) => now - time < 60000,
    )
    if (recentSubmissions.current.length >= 6) {
      throw new Error("Please wait a minute before sending another report.")
    }

    const nearby = reports.find(
      (report) => distanceInMeters({ lat, lng }, report) <= 10,
    )
    const id = `RS-${Math.floor(3000 + Math.random() * 6000)}`
    const district = lat > 18.52 ? "East" : lng < 73.85 ? "West" : "Central"
    const photo =
      photos[0] ||
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=70"

    const reportPayload = {
      id,
      tagId: id,
      lat,
      lng,
      severity,
      hazardType: category,
      status: "Reported" as const,
      confidence: 78,
      district,
      description,
      reportedAt: new Date(now).toISOString(),
      slaDeadline: new Date(now + 72 * 3600000).toISOString(),
      duplicates: nearby ? nearby.duplicates + 1 : 1,
      clusterId: nearby?.clusterId || `C-${id}`,
      priority: nearby ? Math.min(100, nearby.priority + 8) : 68,
      photo,
      photos,
    }

    // Persist to MongoDB through backend API
    const saved = await api.submitReport(reportPayload)
    const finalReport: Report = {
      ...reportPayload,
      ...saved,
      id: saved?.tagId || saved?.id || saved?._id || id,
    }

    add(finalReport)
    refresh().catch(() => {})
    recentSubmissions.current.push(now)
    return finalReport.id
  }

  return (
    <ReporterContext.Provider value={{ submitReport }}>
      {children}
    </ReporterContext.Provider>
  )
}

export const useReporter = () => {
  const value = useContext(ReporterContext)
  if (!value) throw Error("Reporter context missing")
  return value
}
