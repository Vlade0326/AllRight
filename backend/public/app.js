const SCALE = 1_000_000;
let map;
let userMarker;
let zoneCircle;
let config = null;
let lastCoords = null;
let lastProof = null;

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function setStatus(msg, isError = false) {
  const el = document.getElementById('app-status');
  el.textContent = msg;
  el.style.color = isError ? '#c0392b' : '#2d6a4f';
}

function setZoneStatus(inside) {
  const el = document.getElementById('zone-status');
  if (inside === null) {
    el.textContent = '—';
    el.className = 'zone-badge';
    return;
  }
  el.textContent = inside ? 'En zona' : 'Fuera';
  el.className = 'zone-badge ' + (inside ? 'in-zone' : 'out-zone');
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    throw new Error(msg || `Error ${res.status}`);
  }
  return data;
}

function scaleCoords(lat, lon) {
  return {
    lat: Math.round(lat * SCALE),
    lon: Math.round(lon * SCALE),
  };
}

function isInsideBounds(lat, lon, bounds) {
  const s = scaleCoords(lat, lon);
  return (
    s.lat >= bounds.minLat &&
    s.lat <= bounds.maxLat &&
    s.lon >= bounds.minLon &&
    s.lon <= bounds.maxLon
  );
}

function initMap(zone) {
  map = L.map('map', { zoomControl: false }).setView([zone.lat, zone.lon], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  zoneCircle = L.circle([zone.lat, zone.lon], {
    radius: zone.radiusKm * 1000,
    color: '#2d6a4f',
    fillColor: '#95d5b2',
    fillOpacity: 0.25,
    weight: 2,
  }).addTo(map);

  userMarker = L.circleMarker([zone.lat, zone.lon], {
    radius: 8,
    color: '#1d3557',
    fillColor: '#457b9d',
    fillOpacity: 1,
  }).addTo(map);
}

function updateUserPosition(lat, lon) {
  lastCoords = { lat, lon };
  userMarker.setLatLng([lat, lon]);
  document.getElementById('coords-text').textContent =
    `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  if (config?.bounds) {
    setZoneStatus(isInsideBounds(lat, lon, config.bounds));
  }
}

function startGeolocation() {
  if (!navigator.geolocation) {
    setStatus('Geolocalización no disponible en este dispositivo', true);
    useDemoLocation();
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => updateUserPosition(pos.coords.latitude, pos.coords.longitude),
    () => {
      setStatus('Permiso de ubicación denegado — usando demo', true);
      useDemoLocation();
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
  );
}

function useDemoLocation() {
  if (config?.zone) {
    updateUserPosition(config.zone.lat, config.zone.lon);
  }
}

async function loadConfig() {
  config = await apiFetch('/location/config');
}

async function generateProof() {
  if (!lastCoords) {
    setStatus('Esperando ubicación…', true);
    return;
  }

  setStatus('Generando proof…');
  try {
    if (config.adapter === 'snarkjs' && config.zkpAssetsAvailable && typeof snarkjs !== 'undefined') {
      lastProof = await generateProofClient(lastCoords.lat, lastCoords.lon);
      setStatus('Proof Groth16 generado en el dispositivo ✓');
    } else {
      lastProof = await apiFetch('/location/prove', {
        method: 'POST',
        body: JSON.stringify({ lat: lastCoords.lat, lon: lastCoords.lon }),
      });
      setStatus('Proof generado (modo commitment) ✓');
    }
  } catch (e) {
    setStatus('Error al generar: ' + e.message, true);
  }
}

async function generateProofClient(lat, lon) {
  const scaled = scaleCoords(lat, lon);
  const input = {
    userLat: scaled.lat,
    userLon: scaled.lon,
    ...config.bounds,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    '/zkp/geofence.wasm',
    '/zkp/geofence_final.zkey',
  );

  return {
    proof: JSON.stringify(proof),
    payload: {
      adapter: 'snarkjs',
      publicSignals: {
        zoneId: config.zone.id,
        isInside: publicSignals[4] === '1',
        bounds: config.bounds,
        signals: publicSignals,
      },
    },
  };
}

async function verifyProof() {
  if (!lastProof) {
    setStatus('Primero genera un proof', true);
    return;
  }

  setStatus('Verificando…');
  try {
    const result = await apiFetch('/location/verify', {
      method: 'POST',
      body: JSON.stringify({
        proof: lastProof.proof,
        payload: lastProof.payload,
      }),
    });
    setStatus(
      result.valid
        ? `Verificado ✓ — ${result.isInside ? 'dentro de zona' : 'fuera de zona'}`
        : 'Proof inválido ✗',
      !result.valid,
    );
  } catch (e) {
    setStatus('Error al verificar: ' + e.message, true);
  }
}

async function checkGeofence() {
  if (!lastCoords) {
    setStatus('Esperando ubicación…', true);
    return;
  }

  setStatus('Comprobando geofence…');
  try {
    const result = await apiFetch('/security/check-location', {
      method: 'POST',
      body: JSON.stringify({ lat: lastCoords.lat, lon: lastCoords.lon }),
    });
    setStatus(result.message || result.status);
    setZoneStatus(result.status === 'SECURE');
  } catch (e) {
    setStatus('Error: ' + e.message, true);
  }
}

async function init() {
  if (!getToken()) {
    window.location.href = '/';
    return;
  }

  try {
    await loadConfig();
    initMap(config.zone);
    startGeolocation();
    setStatus(`Modo ZKP: ${config.adapter}`);
  } catch (e) {
    setStatus('Error al cargar: ' + e.message, true);
    setTimeout(() => (window.location.href = '/'), 2000);
  }
}

init();
