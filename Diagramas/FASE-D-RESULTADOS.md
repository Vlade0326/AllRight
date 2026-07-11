# Fase D — Producto y despliegue continuo

## Completado

| Ítem | Estado |
|------|--------|
| Historial proofs UI + API | ✅ |
| Frontend React (Vite) | ✅ |
| HTTPS Caddy (`docker:https`) | ✅ |
| K8s Ingress TLS (`k8s:tls`) | ✅ |
| CD → GHCR (`cd.yml`) | ✅ |
| Smoke test post-deploy | ✅ |
| Deploy K8s opcional (`KUBE_CONFIG_DATA`) | ✅ |
| Push notifications (Web Push) | ✅ |
| `/metrics` restringido en prod | ✅ |
| SMTP forgot-password | ✅ |
| Reporte pentest HTML | ✅ |

## Historial proofs

- `GET /location/history`
- `POST /location/prove/record`
- Auditoría `ZKP_PROVE` / `ZKP_VERIFY`

## Frontend React

```bash
npm run dev:web
npm run build:web
```

Rutas: `/` (login), `/app.html` (mapa + ZKP + historial + push)

## HTTPS GPS móvil

```bash
npm run docker:https          # https://<host>:3443
npm run docker:prod:https     # prod + TLS
npm run k8s:tls && npm run k8s:deploy   # https://allright.local
```

## Push notifications

1. Configurar `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (`npm run setup:prod`)
2. En la app, aceptar permiso de notificaciones
3. Notificación al verificar proof válido en zona

## CD

Workflow `.github/workflows/cd.yml`:
- `publish-image` → GHCR
- `smoke-test`
- `deploy-k8s` (si existe secret `KUBE_CONFIG_DATA`)

## Pendiente manual

- [x] Botón de pánico (Fase E1) — ver `Diagramas/FASE-E-PANIC.md`
- [x] BLE proximidad interiores PoC (Fase E2) — ver `Diagramas/FASE-E-BLE.md`
- [x] BLE iBeacon real Web Bluetooth (Fase E3)
- [x] Fusión GPS+BLE (Fase E4) — ver `Diagramas/FASE-E-HYBRID.md`
- [x] Capacitor BLE iOS/Android (Fase E5) — ver `Diagramas/FASE-E-CAPACITOR.md`
- [x] Guía SMTP — ver `Diagramas/SMTP-SETUP.md`
- [x] Forense RAM 500/500 (2026-07-11) — ver `Diagramas/FASE-C-RESULTADOS.md`
- [ ] Burp Suite análisis profundo (guía en `scripts/security/BURP-SUITE.md`)
- [ ] Probar GPS real en móvil vía `https://<IP>:3443`
- [ ] Configurar SMTP real en `.env.production` (credenciales del proveedor)
- [ ] Re-ejecutar forense 5000/5000 tras rebuild prod
- [ ] Build nativo iOS en Mac (`npm run cap:ios`) / Android Studio
