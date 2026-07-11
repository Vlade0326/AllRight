# SMTP — configuración de correo (forgot-password + SOS)

Sin `SMTP_HOST`, AllRight usa **log en consola** (útil en desarrollo).

## Variables (`.env.production`)

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-usuario
SMTP_PASS=tu-password-o-app-password
SMTP_FROM=AllRight <noreply@tudominio.com>

# Destinatario de alertas SOS (opcional)
PANIC_NOTIFY_EMAIL=ops@tudominio.com
APP_URL=https://tudominio-o-ip:3443
```

Tras cambiar env:

```powershell
npm run docker:prod
# o
npm run docker:prod:https
```

## Proveedores típicos

### Mailtrap (pruebas)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=AllRight <noreply@allright.test>
```

### Gmail
1. Activar 2FA
2. Crear *App Password*
3. Usar:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_FROM=AllRight <tu@gmail.com>
```

### Amazon SES / SendGrid / Outlook
Usar host/puerto del proveedor; mismo patrón `SMTP_*`.

## Verificación rápida

```powershell
# Debe responder mensaje genérico (sin filtrar existencia de email)
Invoke-RestMethod -Uri http://127.0.0.1:3000/auth/forgot-password `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"usuario@allright.app"}'
```

En logs del contenedor `allright_api`:
- Sin SMTP: `[EMAIL] to=...`
- Con SMTP: `Email enviado a ...`

## Seguridad

- No commitear `.env.production`
- Preferir app passwords / IAM SMTP
- `PANIC_NOTIFY_EMAIL` solo a un buzón de operaciones
