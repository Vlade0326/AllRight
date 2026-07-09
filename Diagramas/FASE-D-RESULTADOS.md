# Fase D — Producto y despliegue continuo

## Historial de proofs (UI móvil)

| Componente | Detalle |
|------------|---------|
| `GET /location/history` | Historial ZKP del usuario autenticado |
| `POST /location/prove/record` | Registro de proofs generados en cliente (snarkjs) |
| Auditoría | Eventos `ZKP_PROVE` / `ZKP_VERIFY` en `audit_logs` |
| UI | Panel "Historial proofs" con refresh automático |

## Frontend React (Vite)

| Ruta | Página |
|------|--------|
| `/` | Login (`index.html`) |
| `/app.html` | Mapa + ZKP + historial (`app.html`) |

**Workspace:** `frontend/` — React 18 + Leaflet + TypeScript

```bash
npm run dev:web      # Vite dev server :5173 (proxy API)
npm run build:web    # Build → backend/public
npm run build        # Frontend + API
```

## HTTPS para GPS móvil

Los navegadores exigen **contexto seguro** (HTTPS o `localhost`) para `navigator.geolocation`.

| Modo | Comando | URL |
|------|---------|-----|
| Docker + Caddy TLS | `npm run docker:https` | `https://<host>:3443` |
| Docker prod + TLS | `npm run docker:prod:https` | `https://<host>:3443` |
| Kind Ingress | `npm run k8s:tls` + `npm run k8s:deploy` | `https://allright.local` |

Config: `infra/caddy/Caddyfile`, `infra/docker/docker-compose.https.yml`

## CD automático (GitHub Actions)

Workflow: `.github/workflows/cd.yml`

| Job | Trigger `main` | Acción |
|-----|----------------|--------|
| `publish-image` | push | Build `Dockerfile.prod` → push GHCR |
| `smoke-test` | post-publish | Health + login + static pages |

Imagen: `ghcr.io/<owner>/AllRight:latest` y `:sha`

## CI actualizado

- `npm run build` incluye frontend React
- `docker-build` usa `Dockerfile.prod` (raíz del repo)
- E2E Playwright compatible con `app.html` React

## Pendiente Fase D

- [ ] Push notifications
- [ ] Deploy K8s automático (secret `KUBE_CONFIG_DATA`)
- [ ] Burp Suite manual + reporte HTML
- [ ] Restringir `/metrics` en producción
