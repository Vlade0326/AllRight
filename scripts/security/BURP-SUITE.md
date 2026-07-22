# Fase C — Burp Suite (pentest API AllRight)

## Auditoría automática (sin Burp GUI)

Cubre Intruder/Repeater del flujo siguiente (JWT none/tamper, SQLi, rate limit, panic/proximity authz, ZKP vacío, headers):

```powershell
npm run security:burp
```

Reportes:
- `Diagramas/burp-audit-report.txt`
- `Diagramas/burp-report.html`

También: `npm run security:pentest` / `security:pentest:html`

## Requisitos (GUI opcional)

- [Burp Suite Community/Pro](https://portswigger.net/burp)
- API corriendo: `npm run docker:up` o `npm run docker:prod`
- Swagger: http://127.0.0.1:3000/api/docs

## Configuración GUI

1. **Proxy** — Burp escucha en `127.0.0.1:8080`
2. **Scope** — Importar targets desde `scripts/security/burp-targets.json`
3. **Browser** — Proxy del navegador o Burp embedded browser
4. **Mobile** — Proxy Wi‑Fi del teléfono a IP:8080 (misma red)

## Flujo recomendado (GUI)

### 1. Spider + passive scan
- Navegar `/` y `/app.html`
- Revisar headers (CORS, CSP, HSTS)

### 2. Active scan en API

| Endpoint | Riesgo |
|----------|--------|
| `POST /auth/login` | Brute force, SQLi, rate limit |
| `POST /auth/change-password` | IDOR, auth bypass |
| `POST /location/prove` / `verify` | Geofence / ZKP tampering |
| `POST /security/panic` | Auth bypass, abuso SOS |
| `POST /proximity/report` / `gps` | Spoofing BLE/GPS |
| `GET /metrics` | Info disclosure |

### 3. Intruder — brute force login
- Posición: campo `password`
- Verificar `429` tras `RATE_LIMIT_LOGIN_MAX` (default 10/5min)

### 4. Repeater — JWT
- Token expirado, firma alterada, algoritmo `none`

### 5. Exportar
- Burp → Report → HTML → `Diagramas/burp-report.html` (o usar el del script)

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
