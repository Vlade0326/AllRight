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
| /metrics expuesto | PASS (INFO: restringir en prod) |

Reporte: `Diagramas/security-pentest-report.txt`

## Auditoria forense RAM

**Ejecucion:** 5000 intentos en ~25 min  
**Resultado:** 2353 tokens OK, 2647 errores (rate limit global en login — corregido)  
**Contenedor escaneado:** `allright_api`

Reporte: `Diagramas/forensic-ram-audit-report.txt`  
Re-ejecutar tras rebuild: `npm run security:forensic`

## Nuevos endpoints Fase C

| Endpoint | Descripcion |
|----------|-------------|
| `POST /auth/forgot-password` | Solicita token de reset (Redis, 15 min) |
| `POST /auth/reset-password` | Restablece contraseña con token |
| `POST /auth/change-password` | Cambio con JWT (ya existente) |

## Rate limiting

- Global: 120 req/min por IP+ruta
- Login fallido: 10 intentos / 5 min por IP (exitosos no cuentan)

## Burp Suite

Guia manual: `scripts/security/BURP-SUITE.md`  
Targets: `scripts/security/burp-targets.json`
