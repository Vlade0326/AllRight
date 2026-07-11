# Fase E1 — Botón de Pánico

## Objetivo

Alerta manual e inmediata (SOS), distinta del geofence automático (`SECURITY_DESTRUCTION`).

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/security/panic` | JWT | Activa SOS |
| `GET` | `/security/panic/active` | JWT | Alerta activa del usuario |
| `POST` | `/security/panic/:alertId/resolve` | JWT | Cancela falsa alarma |

### Body `POST /security/panic`

```json
{ "lat": 3.4516, "lon": -76.532, "message": "SOS — botón de pánico" }
```

### Respuesta

```json
{
  "alertId": "uuid",
  "userId": "...",
  "status": "ACTIVE",
  "lat": 3.4516,
  "lon": -76.532,
  "triggeredAt": "2026-..."
}
```

## Comportamiento

- Redis: `panic:{alertId}` + `panic:active:{userId}` (TTL 1 h)
- Auditoría: `PANIC_TRIGGERED` / `PANIC_RESOLVED`
- Rate limit: 3 alertas / hora por usuario (`PANIC_RATE_MAX`, `PANIC_RATE_WINDOW_SEC`)
- Conflict 409 si ya hay alerta activa
- Push al usuario + email opcional a `PANIC_NOTIFY_EMAIL`

## UI móvil

- Botón rojo **SOS** (`data-testid="panic-btn"`)
- Modal de confirmación
- Banner activo + **Cancelar falsa alarma**

## Pruebas

| Tipo | Comando / archivo |
|------|-------------------|
| Unit | `trigger-panic.use-case.spec.ts` |
| E2E | `e2e/tests/app.mobile.spec.ts` — panic button |
| Pentest | `POST /security/panic` sin JWT → 401 |

## Variables

```env
PANIC_NOTIFY_EMAIL=ops@example.com
PANIC_RATE_MAX=3
PANIC_RATE_WINDOW_SEC=3600
```

## Diferencia vs geofence

| | Check geofence | Botón SOS |
|--|----------------|-----------|
| Disparo | Auto / check | Solo manual |
| Acción | Destruir llaves si fuera | Alerta + push/email |
| Audit | `SECURITY_DESTRUCTION` | `PANIC_TRIGGERED` |
