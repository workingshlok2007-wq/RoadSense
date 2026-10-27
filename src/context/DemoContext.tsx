import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { reports as seed, type Report } from "../data/mockData"
import { api } from "../services/api"

type Ctx = {
  reports: Report[]
  loading: boolean
  error: string
  weather: boolean
  setWeather: (v: boolean) => void
  update: (id: string, p: Partial<Report>) => Promise<void>
  add: (p: Report) => void
  refresh: () => Promise<void>
  reset: () => void
}

const DemoContext = createContext<Ctx | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [weather, setWeather] = useState(false)

  const refresh = async () => {
    try {
      const data = await api.getReports()
      if (Array.isArray(data) && data.length > 0) {
        setReports(data)
      }
    } catch (err: unknown) {
      console.error("Failed to refresh reports from MongoDB:", err)
    }
  }

  useEffect(() => {
    api
      .getReports()
      .then(setReports)
      .catch(() => setError("Demo data could not be loaded."))
      .finally(() => setLoading(false))
  }, [])

  const update = async (id: string, p: Partial<Report>) => {
    // 1. Immediately update local state for instantaneous user feedback
    setReports((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)))

    // 2. Persist update to MongoDB
    try {
      await api.updateReport(id, p)
    } catch (err: unknown) {
      console.error("Failed to persist update to MongoDB:", err)
    }
  }

  const add = (p: Report) => {
    setReports((r) => [p, ...r.filter((x) => x.id !== p.id)])
  }

  return (
    <DemoContext.Provider
      value={{
        reports,
        loading,
        error,
        weather,
        setWeather,
        update,
        add,
        refresh,
        reset: () => setReports(structuredClone(seed)),
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export const useDemo = () => {
  const v = useContext(DemoContext)
  if (!v) throw Error("Demo context missing")
  return v
}
