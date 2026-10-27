export type Severity = "Low" | "Medium" | "High"
export type Status = "Reported" | "Verified" | "Crew Dispatched" | "Resolved"
export type Hazard = "pothole" | "surface water" | "crack" | "debris" | "broken manhole cover" | "missing road sign" | "other"
export type Report = {
  id: string
  lat: number
  lng: number
  severity: Severity
  hazardType: Hazard
  status: Status
  confidence: number
  district: string
  reportedAt: string
  slaDeadline: string
  duplicates: number
  clusterId: string
  priority: number
  photo: string
  photos?: string[]
  description?: string
  tagId?: string
  _id?: string
  /** ISO timestamp when crew marked this as Resolved */
  resolvedAt?: string
  /** Base64 data URL or URL of the after-repair photo uploaded by crew */
  afterPhoto?: string
}

const severities: Severity[] = ["Low", "Medium", "High"]
const statuses: Status[] = [
  "Reported",
  "Verified",
  "Crew Dispatched",
  "Resolved",
]
const hazards: Hazard[] = ["pothole", "surface water", "crack", "debris"]
const hours = { Low: 168, Medium: 72, High: 24 }
export const reports: Report[] = Array.from({ length: 60 }, (_, i) => {
  const severity = severities[(i * 7) % 3],
    age = (i * 11) % 90
  const reportedAt = new Date(Date.now() - age * 3600000)
  return {
    id: `RS-${2401 + i}`,
    lat: 18.5 + ((i * 13) % 22) / 1000,
    lng: 73.84 + ((i * 17) % 28) / 1000,
    severity,
    hazardType: hazards[i % 4],
    status: statuses[(i * 5) % 4],
    confidence: 72 + ((i * 7) % 27),
    district: ["Central", "East", "West"][i % 3],
    reportedAt: reportedAt.toISOString(),
    slaDeadline: new Date(
      reportedAt.getTime() + hours[severity] * 3600000,
    ).toISOString(),
    duplicates: 1 + ((i * 3) % 12),
    clusterId: `C-${Math.floor(i / 4) + 1}`,
    priority: 42 + ((i * 9) % 58),
    photo: `https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=70`,
  }
})
export const corridors = [
  "Market Avenue",
  "Station Road",
  "Riverfront Drive",
  "Civic Square",
  "University Lane",
  "Industrial Link",
  "Old Town Way",
].map((name, i) => ({
  name,
  business: 95 - i * 8,
  foot: 72 + ((i * 7) % 26),
  delivery: 88 - i * 5,
  severity: 64 + ((i * 6) % 31),
  count: 18 - i,
  sla: 42 + i * 7,
}))
export const leaderboard = [
  {
    district: "Central",
    contractor: "CivicWorks Ltd.",
    onTime: 94,
    average: "18h",
    breached: 3,
  },
  {
    district: "East",
    contractor: "Metro Roadcare",
    onTime: 89,
    average: "22h",
    breached: 6,
  },
  {
    district: "West",
    contractor: "UrbanFix Services",
    onTime: 86,
    average: "27h",
    breached: 8,
  },
]
