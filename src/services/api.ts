import { reports as fallbackReports, type Report } from "../data/mockData"

// When using the Vite proxy configured in vite.config.ts, requests to '/api'
// are automatically proxied to 'http://localhost:5000/api'.
const API_BASE = "/api"

export const api = {
  // Fetch all road tags from MongoDB backend
  getReports: async (): Promise<Report[]> => {
    try {
      const response = await fetch(`${API_BASE}/road-tags`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          id: item.tagId || item.id || item._id,
        }))
      }
      // If DB has no reports yet, provide mock initial reports
      return structuredClone(fallbackReports)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Backend unavailable, falling back to mock data:", message)
      return structuredClone(fallbackReports)
    }
  },

  // Save new road tag report to MongoDB
  submitReport: async (report: Partial<Report>): Promise<Report> => {
    try {
      const response = await fetch(`${API_BASE}/road-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const saved = await response.json()
      return {
        ...report,
        ...saved,
        id: saved.tagId || saved.id || saved._id || report.id,
      } as Report
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Failed to submit to backend, using local state:", message)
      return structuredClone(report) as Report
    }
  },

  // Update report details or status
  updateReport: async (
    id: string,
    updates: Partial<Report>,
  ): Promise<Partial<Report>> => {
    try {
      const response = await fetch(`${API_BASE}/road-tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Failed to update report on backend:", message)
      return updates
    }
  },

  // Delete a report
  deleteReport: async (id: string): Promise<{ id: string }> => {
    try {
      const response = await fetch(`${API_BASE}/road-tags/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Failed to delete report on backend:", message)
      return { id }
    }
  },
}
