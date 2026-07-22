# Fase C — Resultados de seguridad

## Pentest API automatizado

**Fecha:** Jul 2026  
**Target:** `http://127.0.0.1:3000`  
**Resultado:** 8/8 pruebas PASS

| Prueba | Resultado |
|--------|-----------|
| GET /health | PASS |
| Auth bypass (prove sin JWT) | PASS (401) |
| JWT invalido | PASS (401) |
| SQLi en login | PASS (sin 500) |
| Rate limit brute force | PASS (429) |
| forgot-password sin enumeracion | PASS |
| reset-password token invalido | PASS (401) |
| /metrics sin token | PASS (401 si METRICS_TOKEN activo) |

Reportes:
- `Diagramas/security-pentest-report.txt`
- `Diagramas/security-pentest-report.html` (`npm run security:pentest:html`)

## Auditoria forense RAM

**Fecha:** 2026-07-11  
**Ejecucion:** 500/500 logins OK (0 errores, ~7 min) contra `allright_api`  
**Hallazgos:** solo INFO — `JWT_SECRET` / `ZKP_PEPPER` en `/proc/1/environ` (normal con Docker `env_file`). Sin password de usuario ni PEMs en health/API.

Re-ejecutar (5000): `$env:FORENSIC_SESSIONS='5000'; $env:FORENSIC_BATCH='10'; npm run security:forensic`

Reporte: `Diagramas/forensic-ram-audit-report.txt`

## Burp Suite / auditoría Intruder-Repeater

**Fecha:** 2026-07-20  
**Método:** `npm run security:burp` (Burp Community no instalado; script Intruder/Repeater equivalente)  
**Target:** `http://127.0.0.1:3000`

| Área | Resultado |
|------|-----------|
| JWT `none` / firma alterada | PASS (401) |
| AuthZ panic / proximity / history | PASS (401) |
| SQLi login | PASS (sin 500) |
| Rate limit login | PASS (429) |
| forgot-password sin enumeración | PASS |
| Proof ZKP vacío | PASS (400, sin 500) |
| Headers CSP/HSTS | INFO (mejorables en HTTP) |
| `/metrics` | INFO según entorno |

Fixes aplicados durante la auditoría:
- SMTP: no instanciar adapter si falta `SMTP_HOST`
- `POST /location/verify`: 400 si falta proof/payload
- ZKP adapters: no lanzar 500 con payload malformado

Reportes: `Diagramas/burp-audit-report.txt`, `Diagramas/burp-report.html`  
Guía GUI: `scripts/security/BURP-SUITE.md`

## Endpoints Fase C

| Endpoint | Descripcion |
|----------|-------------|
| `POST /auth/forgot-password` | Token reset (Redis 15 min) + email SMTP |
| `POST /auth/reset-password` | Restablece contraseña con token |
| `POST /auth/change-password` | Cambio con JWT |

## Rate limiting

- Global: 120 req/min por IP+ruta
- Login fallido: 10 intentos / 5 min por IP

## Producción

| Variable | Uso |
|----------|-----|
| `METRICS_TOKEN` | Obligatorio en prod — protege `/metrics` |
| `METRICS_ALLOW_PRIVATE` | `true` para scrape interno (Prometheus) |
| `SMTP_HOST` | Email forgot-password (sin host → log consola) |

## Burp Suite

Guia manual: `scripts/security/BURP-SUITE.md`  
Targets: `scripts/security/burp-targets.json`
