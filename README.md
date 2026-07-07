# AllRight

Red social basada en ubicación (LBSN) con privacidad mediante Zero-Knowledge Proofs.

## Arquitectura

Clean Architecture en `backend/src/`:

- `domain/` — entidades, ports, value objects, servicios de dominio
- `application/` — use cases
- `infrastructure/` — TypeORM, Redis, ZKP adapter, Prometheus
- `presentation/` — controllers, guards, interceptors

## Inicio rápido (local)

```bash
cp .env.example .env
npm install
npm run dev:infra          # Postgres, Redis, Prometheus, Grafana
npm run dev:api            # NestJS en :3000
```

## Stack completo (Docker)

```bash
docker compose up -d --build
```

| Servicio    | URL                        |
|-------------|----------------------------|
| API         | http://localhost:3000      |
| Swagger     | http://localhost:3000/api/docs |
| Prometheus  | http://localhost:9090      |
| Grafana     | http://localhost:3001 (admin/admin) |

## Frontend móvil

| Pantalla | URL |
|----------|-----|
| Login | http://localhost:3000 |
| App (mapa + ZKP) | http://localhost:3000/app.html |

Tras login: mapa Leaflet, geolocalización, generar/verificar proof ZKP y check geofence.


```bash
npm run test -w backend      # Jest unit + e2e
npm run test -w e2e            # Playwright móvil
```

## Producción

### 1. Generar secrets

```powershell
npm run setup:prod
```

Crea `.env.production` (no se commitea) con secrets aleatorios.

### 2. Ceremonia ZKP Groth16 (multi-contribución)

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
```

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `DB_SYNCHRONIZE` | `true` | `false` |
| `DB_MIGRATIONS_RUN` | `false` | `true` |
| `ZKP_ADAPTER` | `commitment` | `snarkjs` |
| `ZKP_ARTIFACTS_ENV` | `dev` | `prod` |
| `JWT_SECRET` | cualquiera | único, ≥32 chars |

## Métricas

- `GET /metrics` — Prometheus scrape endpoint
- Dashboard: **AllRight Overview** en Grafana (auto-provisioned)
