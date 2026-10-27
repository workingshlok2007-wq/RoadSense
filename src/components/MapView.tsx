import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import type { Report } from "../data/mockData"
const icon = (r: Report) =>
  L.divIcon({
    className: "",
    html: `<div class="map-marker ${r.severity.toLowerCase()} ${
      r.hazardType === "surface water" ? "water" : ""
    }" aria-label="${r.severity} severity ${r.hazardType}">${
      r.severity === "High" ? "!" : r.severity === "Medium" ? "▲" : "●"
    }</div>`,
  })
export function MapView({
  reports,
  onSelect,
  geofences = false,
  className = "",
}: {
  reports: Report[]
  onSelect?: (r: Report) => void
  geofences?: boolean
  className?: string
}) {
  return (
    <div
      className={`map-wrap ${className}`}
      aria-label="Interactive road hazard map"
    >
      <MapContainer
        center={[18.511, 73.854]}
        zoom={14}
        scrollWheelZoom
        className="map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geofences &&
          reports
            .filter((_, i) => i % 4 === 0)
            .map((r) => (
              <Circle
                key={"c" + r.id}
                center={[r.lat, r.lng]}
                radius={10}
                pathOptions={{ color: "#1D4ED8", fillOpacity: 0.08 }}
              />
            ))}
        {reports.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={icon(r)}
            eventHandlers={{ click: () => onSelect?.(r) }}
          >
            <Popup>
              <b>{r.id}</b>
              <br />
              {r.hazardType} · {r.severity}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
