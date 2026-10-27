import { useMemo, useState } from "react"
import {
  CloudRain,
  Layers3,
  ShieldAlert,
  X,
  Clock3,
  Camera,
  RotateCcw,
} from "lucide-react"
import { useDemo } from "../context/DemoContext"
import type { Report } from "../data/mockData"
import { MapView } from "../components/MapView"
import { Badge, Button, Card, Empty, Heading, Skeleton } from "../components/ui"
export default function MapPage() {
  const { reports, loading, error, weather, setWeather, refresh } = useDemo()
  const [selected, setSelected] = useState<Report | null>(null),
    [geo, setGeo] = useState(true)
  const [severity, setSeverity] = useState("All"),
    [district, setDistrict] = useState("All"),
    [hazard, setHazard] = useState("All")
  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          (severity === "All" || r.severity === severity) &&
          (district === "All" || r.district === district) &&
          (hazard === "All" || r.hazardType === hazard),
      ),
    [reports, severity, district, hazard],
  )
  if (loading)
    return (
      <>
        <Heading>Operations map</Heading>
        <Skeleton />
      </>
    )
  return (
    <>
      <Heading sub="Real-time detection, verification and dispatch across the city">
        Operations map
      </Heading>
      {error && <div className="alert">{error}</div>}
      <div className="toolbar">
        <div className="filters">
          {[
            [
              "Severity",
              severity,
              setSeverity,
              ["All", "High", "Medium", "Low"],
            ],
            [
              "District",
              district,
              setDistrict,
              ["All", "Central", "East", "West"],
            ],
            [
              "Hazard",
              hazard,
              setHazard,
              ["All", "pothole", "surface water", "crack", "debris"],
            ],
          ].map(([n, v, set, opts]: any) => (
            <label key={n}>
              {n}
              <select value={v} onChange={(e) => set(e.target.value)}>
                {opts.map((o: string) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span>
            <b>{filtered.length}</b> results
          </span>
          <Button
            className="ghost"
            style={{
              padding: "0.3rem 0.6rem",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
            onClick={refresh}
            title="Re-fetch latest reports from MongoDB"
          >
            <RotateCcw style={{ width: 13, height: 13 }} /> Sync DB
          </Button>
        </div>
      </div>
      <Card className={`weather ${weather ? "active" : ""}`}>
        <div>
          <CloudRain />
          <span>
            <b>Weather Overlay</b>
            <small>Heavy Rainfall Simulation</small>
          </span>
        </div>
        <Button
          className={weather ? "amber" : ""}
          aria-pressed={weather}
          onClick={() => setWeather(!weather)}
        >
          {weather ? "Simulation on" : "Turn on"}
        </Button>
      </Card>
      {weather && (
        <div className="weather-grid">
          <Card>
            <ShieldAlert />
            <div>
              <b>Needs human review</b>
              <p>
                {filtered.filter((_, i) => i % 7 === 0).length} low-confidence
                detections removed from auto-dispatch.
              </p>
            </div>
          </Card>
          <Card>
            <b>Pothole</b>
            <span>Depth cue, irregular shadow edge</span>
            <b>Surface water</b>
            <span>Reflection, flat depth, dashed marker</span>
          </Card>
        </div>
      )}
      <div className="map-layout">
        <div className="map-card">
          {filtered.length ? (
            <MapView
              reports={filtered}
              onSelect={setSelected}
              geofences={geo}
            />
          ) : (
            <Empty />
          )}
          <Button
            className="map-control"
            onClick={() => setGeo(!geo)}
            aria-pressed={geo}
          >
            <Layers3 /> 10m geofences {geo ? "on" : "off"}
          </Button>
          {weather && <div className="rain" aria-hidden="true" />}
        </div>
        {selected && (
          <Card className="detail-panel">
            <Button className="icon close" onClick={() => setSelected(null)}>
              <X />
            </Button>
            <img src={selected.photo} alt={selected.hazardType} />
            <div className="spread">
              <Badge tone={selected.severity.toLowerCase()}>
                {selected.severity} severity
              </Badge>
              <b>{selected.id}</b>
            </div>
            <h2>{selected.hazardType}</h2>
            <p>
              {selected.district} district · {selected.status}
            </p>
            {selected.description && (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "#475569",
                  marginTop: "0.25rem",
                  fontStyle: "italic",
                }}
              >
                {selected.description}
              </p>
            )}
            <div className="metric-grid">
              <span>
                <Camera />
                AI confidence
                <b>
                  {weather && selected.id.endsWith("1")
                    ? "54%"
                    : selected.confidence + "%"}
                </b>
              </span>
              <span>
                <Clock3 />
                SLA time left
                <b>
                  {Math.max(
                    0,
                    Math.round(
                      (new Date(selected.slaDeadline).getTime() - Date.now()) /
                        3600000,
                    ),
                  )}
                  h
                </b>
              </span>
              <span>
                Duplicates<b>{selected.duplicates}</b>
              </span>
              <span>
                Priority<b>{selected.priority}/100</b>
              </span>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
