import { ProofHistory } from '../components/ProofHistory';
import { MapView } from '../components/MapView';
import { useLocationApp } from '../hooks/useLocationApp';

export function AppPage() {
  const app = useLocationApp();

  if (app.loading) {
    return (
      <div className="s25-frame app-frame">
        <div className="camera-notch" />
        <div className="screen app-screen">
          <p className="status">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!app.config) {
    return null;
  }

  return (
    <div className="s25-frame app-frame">
      <div className="camera-notch" />
      <div className="screen app-screen">
        <header className="app-header">
          <h1>AllRight</h1>
          <button
            className="btn-icon"
            onClick={app.logout}
            title="Cerrar sesión"
            data-testid="logout-btn"
          >
            ⎋
          </button>
        </header>

        <MapView
          zone={app.config.zone}
          coords={app.coords}
          onPosition={app.setCoords}
          gpsWarning={app.gpsWarning}
          enableGps={app.enableGps}
        />

        <div className="coords-panel" data-testid="coords-panel">
          <span>
            {app.coords
              ? `${app.coords.lat.toFixed(5)}, ${app.coords.lon.toFixed(5)}`
              : 'Obteniendo ubicación…'}
          </span>
          <span
            className={`zone-badge${
              app.zoneInside === null ? '' : app.zoneInside ? ' in-zone' : ' out-zone'
            }`}
            data-testid="zone-status"
          >
            {app.zoneInside === null ? '—' : app.zoneInside ? 'En zona' : 'Fuera'}
          </span>
        </div>

        <div className="action-panel">
          <button className="btn-primary" onClick={app.generateProof} data-testid="prove-btn">
            Generar proof ZKP
          </button>
          <button className="btn-secondary" onClick={app.verifyProof} data-testid="verify-btn">
            Verificar proof
          </button>
          <button className="btn-secondary" onClick={app.checkGeofence} data-testid="geofence-btn">
            Check geofence
          </button>
        </div>

        <ProofHistory items={app.history} onRefresh={app.loadHistory} />

        <p
          className="status app-status"
          data-testid="app-status"
          style={{ color: app.statusError ? '#c0392b' : '#2d6a4f' }}
        >
          {app.status}
        </p>
      </div>
    </div>
  );
}
