# Fase C — Burp Suite (pentest API AllRight)

## Requisitos

- [Burp Suite Community/Pro](https://portswigger.net/burp)
- API corriendo: `npm run docker:up` o `npm run docker:prod`
- Swagger: http://127.0.0.1:3000/api/docs

## Configuración

1. **Proxy** — Burp escucha en `127.0.0.1:8080`
2. **Scope** — Importar targets desde `scripts/security/burp-targets.json`
3. **Browser** — Configurar proxy del navegador o usar Burp's embedded browser
4. **Mobile** — Proxy Wi‑Fi del teléfono apuntando a IP:8080 (misma red)

## Flujo recomendado

### 1. Spider + passive scan
- Navegar login móvil (`/index.html`) y app (`/app.html`)
- Revisar headers de seguridad (CORS, CSP, HSTS)

### 2. Active scan en API
Endpoints prioritarios (ver `burp-targets.json`):

| Endpoint | Riesgo |
|----------|--------|
| `POST /auth/login` | Brute force, SQLi, rate limit |
| `POST /auth/change-password` | IDOR, auth bypass |
| `POST /location/prove` | Geofence bypass |
| `POST /location/verify` | ZKP tampering |
| `GET /metrics` | Info disclosure |

### 3. Intruder — brute force login
- Posición: campo `password`
- Payload: wordlist común
- Verificar respuesta `429` tras superar `RATE_LIMIT_LOGIN_MAX` (default 10/5min)

### 4. Repeater — JWT
- Copiar `Authorization: Bearer` del login
- Probar: token expirado, firma alterada, algoritmo `none`

### 5. Exportar reporte
- Burp → Report → HTML
- Guardar en `Diagramas/burp-report.html`

## Credenciales demo

- Email: `usuario@allright.app`
- Password: `AllRight2026!Secure`

## Verificación rate limiting

```powershell
for ($i=1; $i -le 15; $i++) {
  try {
    Invoke-WebRequest -Uri http://127.0.0.1:3000/auth/login -Method POST `
      -ContentType application/json `
      -Body '{"email":"test@test.com","password":"wrong"}' `
      -SkipHttpErrorCheck | Select-Object StatusCode
  } catch { $_.Exception.Response.StatusCode.value__ }
}
```
