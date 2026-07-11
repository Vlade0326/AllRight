# Fase E2/E3 — BLE proximidad en interiores

## Objetivo

Complementar GPS (poco fiable en interiores) con beacons BLE / **iBeacon** autorizados.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/proximity/zones` | JWT | Beacons whitelist |
| `GET` | `/proximity/status` | JWT | Último estado BLE |
| `POST` | `/proximity/report` | JWT | Reportar detección |

## E3 — Parseo iBeacon real (Web Bluetooth)

### Cliente

| Módulo | Rol |
|--------|-----|
| `frontend/src/ble/ibeacon.ts` | Parse manufacturer data Apple `0x004C` |
| `frontend/src/ble/scanBeacons.ts` | `requestLEScan` → fallback `watchAdvertisements` |
| `BleProximity` | Botón **Escanear iBeacon real** / Detener |

### Formato iBeacon (tras company id)

```
02 15 | UUID[16] | major[2 BE] | minor[2 BE] | txPower[1]
```

### Flujo escaneo

1. Preferir `navigator.bluetooth.requestLEScan({ filters: manufacturerData 0x004C })`
2. Si no existe: `requestDevice` + `watchAdvertisements`
3. Parsear ads → match whitelist (uuid/major/minor) → `POST /proximity/report` (throttle 2s)
4. Beacons fuera de whitelist: aviso, no report

### Requisitos dispositivo

- **Chrome / Edge Android** + **HTTPS** (o localhost)
- Flags opcionales: `chrome://flags` → *Experimental Web Platform features* / *Web Bluetooth*
- **iOS Safari:** no soporta Web Bluetooth → E5 Capacitor

### UI

- Simular detección (E2, E2E sin hardware)
- **Escanear iBeacon real** / Detener escaneo
- Último ad mostrado (`ble-last-hit`)

## Beacons seed

| ID | Nombre | Major/Minor | Umbral RSSI |
|----|--------|-------------|-------------|
| `cali-office-lobby` | Lobby Cali | 1/1 | ≥ -70 |
| `cali-safe-room` | Sala segura | 1/2 | ≥ -65 |

UUID: `f7826da6-4fa2-4e98-8024-bc5b71e0893e`

## Pruebas

| Tipo | Detalle |
|------|---------|
| Unit backend | `report-proximity.use-case.spec.ts` |
| Unit frontend | `npm run test -w frontend` → `ibeacon.spec.ts` |
| E2E | Simular detección → zona interior |
| Manual | Beacon físico + Chrome Android + `docker:prod:https` |

## Limitaciones

- iOS Safari sin Web Bluetooth (E5)
- Algunos desktop Chrome limitan `requestLEScan`
- Spoofing mitigado solo por whitelist + umbral RSSI

## Siguiente

- E4: fusión GPS + BLE (estado híbrido)
- E5: Capacitor BLE para iOS
