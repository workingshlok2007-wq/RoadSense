import { reports as fallbackReports, type Report } from "../data/mockData"

export type BackendReport = Report & {
  _id?: string
  tagId?: string
}

// Target endpoints to communicate with backend:
// 1. Relative '/api' (proxied by Vite dev server to Express on port 5000)
// 2. Direct 'http://localhost:5000/api' (direct CORS connection to Express on port 5000)
const API_ENDPOINTS: string[] = ["/api", "http://localhost:5000/api"]

function safeClone<T>(data: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(data)
  }
  return JSON.parse(JSON.stringify(data)) as T
}

async function requestWithFallback(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let lastError: unknown = null

  for (const base of API_ENDPOINTS) {
    try {
      const url = `${base}${path}`
      const response = await fetch(url, options)
      // If we got a valid response (not 404 proxy miss or 502 bad gateway), return it
      if (response.status !== 404 && response.status !== 502) {
        return response
      }
    } catch (err: unknown) {
      lastError = err
    }
  }

  throw lastError || new Error(`Failed to communicate with backend at ${path}`)
}

export const api = {
  // Fetch all road tags from MongoDB backend
  getReports: async (): Promise<Report[]> => {
    try {
      const response = await requestWithFallback("/road-tags")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as BackendReport[]

      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: BackendReport) => ({
          ...item,
          id:
            item.tagId ||
            item.id ||
            item._id ||
            `RS-${Math.floor(1000 + Math.random() * 9000)}`,
        }))
      }
      return safeClone(fallbackReports)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Backend unavailable, using fallback mock data:", message)
      return safeClone(fallbackReports)
    }
  },

  // Save new road tag report to MongoDB (POST /api/road-tags)
  submitReport: async (report: Partial<Report>): Promise<Report> => {
    try {
      const response = await requestWithFallback("/road-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string
          details?: string
        }
        throw new Error(
          errorData.error ||
            errorData.details ||
            `Server responded with HTTP ${response.status}`,
        )
      }

      const saved = (await response.json()) as BackendReport
      return {
        ...report,
        ...saved,
        id: saved.tagId || saved.id || saved._id || report.id || "",
      } as Report
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("Failed to save report to MongoDB backend:", message)
      throw new Error(`Failed to save report to database: ${message}`)
    }
  },

  // Alias for submitReport
  createReport: async (report: Partial<Report>): Promise<Report> => {
    return api.submitReport(report)
  },

  // Update report details or status (PUT /api/road-tags/:id)
  updateReport: async (
    id: string,
    updates: Partial<Report>,
  ): Promise<Partial<Report>> => {
    try {
      const response = await requestWithFallback(`/road-tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return (await response.json()) as Partial<Report>
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Failed to update report ${id} in MongoDB:`, message)
      throw new Error(`Database update failed: ${message}`)
    }
  },

  // Delete a report (DELETE /api/road-tags/:id)
  deleteReport: async (id: string): Promise<{ id: string }> => {
    try {
      const response = await requestWithFallback(`/road-tags/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()) as { id: string }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("Failed to delete report on backend:", message)
      return { id }
    }
  },
}

export default api
