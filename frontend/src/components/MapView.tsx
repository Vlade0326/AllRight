import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, useMap } from 'react-leaflet';

interface Coords {
  lat: number;
  lon: number;
}

interface Zone {
  lat: number;
  lon: number;
  radiusKm: number;
}

function Recenter({ coords }: { coords: Coords | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lon], map.getZoom());
  }, [coords, map]);
  return null;
}

interface MapViewProps {
  zone: Zone;
  coords: Coords | null;
  onPosition: (lat: number, lon: number) => void;
  gpsWarning: string | null;
  enableGps: boolean;
}

export function MapView({ zone, coords, onPosition, gpsWarning, enableGps }: MapViewProps) {
  useEffect(() => {
    if (!enableGps || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => onPosition(pos.coords.latitude, pos.coords.longitude),
      () => onPosition(zone.lat, zone.lon),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [zone.lat, zone.lon, onPosition, enableGps]);

  const marker = coords ?? { lat: zone.lat, lon: zone.lon };

  return (
    <>
      {gpsWarning && <p className="gps-warning">{gpsWarning}</p>}
      <div className="map-container" data-testid="map">
        <MapContainer
          center={[zone.lat, zone.lon]}
          zoom={15}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Circle
            center={[zone.lat, zone.lon]}
            radius={zone.radiusKm * 1000}
            pathOptions={{
              color: '#2d6a4f',
              fillColor: '#95d5b2',
              fillOpacity: 0.25,
              weight: 2,
            }}
          />
          <CircleMarker
            center={[marker.lat, marker.lon]}
            radius={8}
            pathOptions={{
              color: '#1d3557',
              fillColor: '#457b9d',
              fillOpacity: 1,
            }}
          />
          <Recenter coords={coords} />
        </MapContainer>
      </div>
    </>
  );
}
