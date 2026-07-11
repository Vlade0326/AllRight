# Fase E4 — Fusión GPS + BLE (estado híbrido)

## Objetivo

Combinar geofence GPS y proximidad BLE en un único estado de seguridad.

## Reglas de fusión

| GPS | BLE | Modo | Seguro |
|-----|-----|------|--------|
| * | inside | `SECURE_INDOOR` | sí (BLE manda en interiores) |
| inside | outside/unknown | `SECURE_OUTDOOR` | sí |
| outside | outside/unknown | `OUTSIDE` | no |
| unknown | outside | `OUTSIDE` | no |
| unknown | unknown | `UNKNOWN` | no |

**Clave:** si GPS dice fuera pero BLE detecta beacon whitelist → **interior seguro** (GPS falla en edificios).

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/proximity/gps` | Reporta presencia GPS `{ lat, lon, inside }` |
| `GET` | `/proximity/hybrid` | Estado fusionado |

### Ejemplo `GET /proximity/hybrid`

```json
{
  "mode": "SECURE_INDOOR",
  "label": "Seguro (interior BLE)",
  "secure": true,
  "gps": "outside",
  "ble": "inside",
  "source": "ble",
  "beaconId": "cali-safe-room",
  "beaconName": "Sala segura"
}
```

## Redis

- `gps:last:{userId}` TTL 120s
- `ble:last:{userId}` TTL 60s (E2)

## UI

Badge híbrido bajo el panel de coordenadas (`data-testid="hybrid-status"`), se refresca al mover GPS o al reportar BLE.

## Código

- Dominio: `hybrid-location.domain-service.ts`
- Use cases: `report-gps-presence`, `get-hybrid-status`
- Frontend: `HybridStatusBadge.tsx`

## Pruebas

| Tipo | Detalle |
|------|---------|
| Unit | `hybrid-location.domain-service.spec.ts` |
| E2E | Simular BLE → badge muestra interior/seguro |

## Siguiente

- E5: Capacitor BLE nativo — ver `Diagramas/FASE-E-CAPACITOR.md` ✅
