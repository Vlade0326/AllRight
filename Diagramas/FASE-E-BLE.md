# Fase E2 — BLE proximidad en interiores

## Objetivo

Complementar GPS (poco fiable en interiores) con beacons BLE autorizados.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/proximity/zones` | JWT | Beacons whitelist |
| `GET` | `/proximity/status` | JWT | Último estado BLE |
| `POST` | `/proximity/report` | JWT | Reportar detección |

### Body `POST /proximity/report`

```json
{
  "beaconId": "cali-office-lobby",
  "uuid": "f7826da6-4fa2-4e98-8024-bc5b71e0893e",
  "major": 1,
  "minor": 1,
  "rssi": -55
}
```

### Respuesta

```json
{
  "status": "inside",
  "beaconId": "cali-office-lobby",
  "beaconName": "Lobby Cali",
  "rssi": -55,
  "updatedAt": "..."
}
```

## Beacons seed (PoC)

| ID | Nombre | Major/Minor | Umbral RSSI |
|----|--------|-------------|-------------|
| `cali-office-lobby` | Lobby Cali | 1/1 | ≥ -70 |
| `cali-safe-room` | Sala segura | 1/2 | ≥ -65 |

UUID compartido: `f7826da6-4fa2-4e98-8024-bc5b71e0893e`

## Comportamiento

- Solo beacons en whitelist
- `inside` si `rssi >= rssiThreshold`
- Redis: `ble:last:{userId}` (60s), `ble:inside:{userId}` (90s)
- Auditoría: `BLE_PROXIMITY`

## UI

Panel **Proximidad BLE** en `app.html`:
- Estado: Sin señal / En zona interior / Sin proximidad
- **Simular detección** (slider RSSI) — para PoC/E2E sin hardware
- **Escanear BLE** si Web Bluetooth está disponible (Chrome/Android + HTTPS)

## Pruebas

| Tipo | Detalle |
|------|---------|
| Unit | `report-proximity.use-case.spec.ts` |
| E2E | Simular detección → `en zona interior` |
| Pentest | report sin JWT → 401 |

## Limitaciones PoC

- Web Bluetooth no soporta iOS Safari
- Parseo iBeacon real (manufacturer data) pendiente — E3/E5
- Capacitor nativo pendiente (Fase E5)

## Siguiente

- E3: parseo iBeacon real en Web Bluetooth
- E4: fusión GPS + BLE (estado híbrido)
- E5: Capacitor BLE para iOS
