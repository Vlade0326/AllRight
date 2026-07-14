# AllRight

Red social basada en ubicación (LBSN) con privacidad mediante Zero-Knowledge Proofs.

Demuestra presencia en una geofence **sin revelar coordenadas exactas** al servidor (commitment en dev, Groth16/snarkjs en prod).

## Características

| Área | Qué incluye |
|------|-------------|
| ZKP | Circuito Circom + ceremonia multi-contribución; historial de proofs |
| Auth | Login JWT, cambio / forgot / reset password (Redis + email) |
| Seguridad | Rate limits, check geofence, botón SOS, `/metrics` protegido en prod |
| Proximidad | BLE (simulador / Web Bluetooth iBeacon / Capacitor), fusión GPS+BLE |
| Frontend | React + Vite → `backend/public`; HTTPS Caddy para GPS móvil |
| Ops | Docker, Kind K8s, Terraform (AWS/GCP/Azure), CD → GHCR, Prometheus/Grafana |

## Arquitectura

Monorepo npm (`backend`, `frontend`, `e2e`). Clean Architecture en `backend/src/`:

- `domain/` — entidades, ports, value objects, servicios de dominio
- `application/` — use cases
- `infrastructure/` — TypeORM, Redis, ZKP, SMTP, métricas
- `presentation/` — controllers, guards, interceptors, Swagger

## Inicio rápido (local)

```bash
cp .env.example .env
npm install
npm run dev:infra          # Postgres, Redis, Prometheus, Grafana
npm run dev:api            # NestJS en :3000
npm run dev:web            # Vite (opcional; el build va a backend/public)
```

## Stack completo (Docker)

```bash
docker compose up -d --build
# o
npm run docker:up
```

| Servicio    | URL                            |
|-------------|--------------------------------|
| API / UI    | http://localhost:3000          |
| Swagger     | http://localhost:3000/api/docs |
| Prometheus  | http://localhost:9090          |
| Grafana     | http://localhost:3001 (admin/admin) |

### HTTPS (GPS / Web Bluetooth en móvil)

```bash
npm run docker:https          # https://<host>:3443
npm run docker:prod:https     # prod + TLS
```

## Frontend

| Pantalla | Ruta |
|----------|------|
| Login | `/` |
| App (mapa, ZKP, historial, panic, BLE, hybrid) | `/app.html` |

```bash
npm run build:web             # React → backend/public
npm run cap:sync              # Capacitor
npm run cap:android           # Android Studio
npm run cap:ios               # requiere macOS
```

Docs nativos: `Diagramas/FASE-E-CAPACITOR.md`

## API (resumen)

| Grupo | Endpoints clave |
|-------|-----------------|
| Auth | `POST /auth/login`, `forgot-password`, `reset-password`, `change-password` |
| Location | `GET /location/config`, `history`; `POST prove`, `prove/record`, `verify` |
| Security | `POST /security/check-location`, `panic`; `GET panic/active` |
| Proximity | `GET zones`, `status`, `hybrid`; `POST gps`, `report` |
| Push | `GET /notifications/vapid-public-key`; `POST subscribe` |
| Ops | `GET /health`, `/health/ready`, `/metrics`, `/api/docs` |

## Tests y carga

```bash
npm run test -w backend
npm run test:frontend
npm run test:e2e
npm run loadtest:100          # k6
npm run loadtest:zkp
```

## Seguridad

```bash
npm run security:pentest
npm run security:pentest:html
npm run security:forensic     # auditoría RAM (sesiones concurrentes)
```

Guías: `scripts/security/BURP-SUITE.md`, `Diagramas/FASE-C-RESULTADOS.md`

## Producción

### 1. Generar secrets

```powershell
npm run setup:prod
```

Crea `.env.production` (no se commitea). Incluye JWT, ZKP pepper, VAPID; SMTP opcional (ver abajo).

### 2. Ceremonia ZKP Groth16

```bash
cd backend
npm run zkp:build:prod
npm run zkp:ceremony:verify
```

- Dev: `artifacts/dev/` — 1 contribución  
- Prod: `artifacts/prod/` — 3 contribuciones  
- Guía: `backend/circuits/ceremony/README.md`

### 3. Desplegar

```bash
npm run docker:prod
# Kubernetes (Kind)
npm run k8s:deploy            # API :30080
npm run k8s:tls               # Ingress HTTPS (allright.local)
```

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `DB_SYNCHRONIZE` | `true` | `false` |
| `DB_MIGRATIONS_RUN` | `false` | `true` |
| `ZKP_ADAPTER` | `commitment` | `snarkjs` |
| `ZKP_ARTIFACTS_ENV` | `dev` | `prod` |
| `JWT_SECRET` | cualquiera | único, ≥32 chars |
| `METRICS_TOKEN` | opcional | ≥16 chars (protege `/metrics`) |
| `SMTP_HOST` | vacío (= log consola) | SMTP real |

### Email (SMTP)

Sin `SMTP_HOST` los correos se loguean en consola. Con proveedor (Mailtrap, Gmail, SES…):

```env
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=AllRight <noreply@tudominio.com>
PANIC_NOTIFY_EMAIL=ops@tudominio.com
APP_URL=https://tudominio:3443
```

Guía: `Diagramas/SMTP-SETUP.md`

## CI/CD

- CI: tests, lint, build (GitHub Actions)
- CD (`.github/workflows/cd.yml`): imagen → GHCR, smoke test, deploy K8s opcional (`KUBE_CONFIG_DATA`)

## Métricas

- `GET /metrics` — Prometheus (en prod requiere `METRICS_TOKEN` / red privada)
- Dashboard **AllRight Overview** en Grafana (auto-provisioned)

## Documentación

| Documento | Contenido |
|-----------|-----------|
| `docs/ALLRIGHT-DOCUMENTACION-TECNICA.md` | Arquitectura, API, desplegues |
| `npm run docs:pdf` | PDF de la doc técnica |
| `Diagramas/FASE-C-RESULTADOS.md` | Pentest + forense |
| `Diagramas/FASE-D-RESULTADOS.md` | Producto, CD, HTTPS, push |
| `Diagramas/FASE-E-*.md` | Panic, BLE, hybrid, Capacitor |
| `Diagramas/SMTP-SETUP.md` | Configuración de correo |

## Terraform

```bash
cd infra/terraform/{aws|gcp|azure}
terraform init && terraform plan && terraform apply
```
