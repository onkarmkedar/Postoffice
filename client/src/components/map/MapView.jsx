import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView({ offices, userLocation }) {
  const center = userLocation || { lat: 22.9734, lng: 78.6569 };

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={6} style={{ height: '320px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {offices
        .filter((office) => office.latitude && office.longitude)
        .map((office) => (
          <Marker key={`${office.name}-${office.pincode}`} position={[Number(office.latitude), Number(office.longitude)]}>
            <Popup>
              {office.name} ({office.pincode})
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
