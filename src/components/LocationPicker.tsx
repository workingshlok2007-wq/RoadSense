import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const pin=L.divIcon({className:'report-pin',html:'<span aria-hidden="true"></span>',iconSize:[28,36],iconAnchor:[14,36]})

function ClickPicker({onChange}:{onChange:(lat:number,lng:number)=>void}){
 useMapEvents({click:event=>onChange(event.latlng.lat,event.latlng.lng)})
 return null
}

export function LocationPicker({lat,lng,onChange}:{lat:number;lng:number;onChange:(lat:number,lng:number)=>void}){
 return <div className="location-picker" aria-label="Choose report location on map">
  <MapContainer center={[lat,lng]} zoom={16} className="map">
   <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
   <Marker position={[lat,lng]} icon={pin} draggable eventHandlers={{dragend:event=>{const point=event.target.getLatLng();onChange(point.lat,point.lng)}}}/>
   <ClickPicker onChange={onChange}/>
  </MapContainer>
 </div>
}
