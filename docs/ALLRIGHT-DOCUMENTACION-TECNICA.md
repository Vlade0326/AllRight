---
title: AllRight — Documentación Técnica e Implementación
author: AllRight Project
date: Julio 2026
---

# AllRight — Documentación Técnica e Guía de Implementación

**Red social basada en ubicación (LBSN) con privacidad mediante Zero-Knowledge Proofs**

Versión del documento: 1.0 · Julio 2026

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Capas Clean Architecture](#4-capas-clean-architecture)
5. [Modelo de privacidad ZKP](#5-modelo-de-privacidad-zkp)
6. [Circuito Circom (geofence.circom)](#6-circuito-circom-geofencecircom)
7. [Ceremonia ZKP paso a paso](#7-ceremonia-zkp-paso-a-paso)
8. [API REST](#8-api-rest)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Frontend móvil](#10-frontend-móvil)
11. [Guía de implementación por entorno](#11-guía-de-implementación-por-entorno)
12. [Despliegue AWS (ECS Fargate)](#12-despliegue-aws-ecs-fargate)
13. [Despliegue GCP (Cloud Run)](#13-despliegue-gcp-cloud-run)
14. [Kubernetes (Kind)](#14-kubernetes-kind)
15. [Observabilidad y pruebas](#15-observabilidad-y-pruebas)
16. [Seguridad](#16-seguridad)
17. [Estructura del repositorio](#17-estructura-del-repositorio)
18. [Checklist de producción](#18-checklist-de-producción)

---

## 1. Resumen ejecutivo

**AllRight** es una red social basada en ubicación (LBSN — *Location-Based Social Network*) que permite demostrar que un usuario está dentro de una zona geográfica (geofence) **sin revelar sus coordenadas exactas** al servidor, mediante Zero-Knowledge Proofs (ZKP).

### Flujo principal del usuario

1. Registro y login → JWT
2. Geolocalización en el cliente (navegador/dispositivo)
3. Generación de prueba ZKP (commitment en dev, Groth16 en prod)
4. Verificación en backend
5. Check de geofence con acción de seguridad si sale de la zona

### Características clave

- Clean Architecture en NestJS (cloud-agnostic)
- Dos adaptadores ZKP intercambiables: `commitment` (dev) y `snarkjs` (prod)
- Groth16 con Circom 2.1 y ceremonia multi-contribución
- PostgreSQL + Redis + Prometheus + Grafana
- Despliegue: local, Docker, Kubernetes (Kind), Terraform (AWS/GCP/Azure)

---

## 2. Arquitectura del sistema

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  Frontend móvil │────▶│  NestJS API (Clean Architecture)         │
│  (React/Vite +  │     │  domain → application → infrastructure   │
│   Capacitor)    │     │           → presentation                 │
└─────────────────┘     └──────┬───────────┬───────────┬───────────┘
                               │           │           │
                          PostgreSQL    Redis    Prometheus/Grafana
```

Monorepo npm con workspaces (`backend`, `frontend`, `e2e`).

| Capa | Ruta | Responsabilidad |
|------|------|-----------------|
| Domain | `backend/src/domain/` | Entidades, ports, value objects, servicios puros |
| Application | `backend/src/application/` | Use cases |
| Infrastructure | `backend/src/infrastructure/` | TypeORM, Redis, ZKP, SMTP, métricas |
| Presentation | `backend/src/presentation/` | Controllers, guards, Swagger |

---

## 3. Stack tecnológico

| Componente | Tecnología |
|------------|------------|
| API | NestJS 10+, TypeScript |
| Base de datos | PostgreSQL 15 + TypeORM |
| Cache / rate limit | Redis 7 |
| Autenticación | JWT + bcrypt |
| ZKP desarrollo | Adapter `commitment` (HMAC + nonce) |
| ZKP producción | Groth16 — Circom 2.1 + snarkjs 0.7.5 |
| Observabilidad | Prometheus + Grafana |
| Frontend | HTML estático + Leaflet |
| Tests unitarios | Jest |
| Tests E2E móvil | Playwright |
| CI | GitHub Actions |
| Pruebas de carga | k6 |

---

## 4. Capas Clean Architecture

### 4.1 Domain — Núcleo de negocio

No depende de NestJS, TypeORM ni Redis.

- **Entidades:** `GeofenceZone`, `LocationProof`
- **Value objects:** `Coordinates` (lat/lon inmutables)
- **Ports:** `ILocationProofPort`, `IUserRepository`, `IAuditRepository`, `ICachePort`
- **Servicios:** `GeofenceDomainService` — distancia Haversine; si distancia ≤ radio → dentro

> La geofence real es **circular** (Haversine), pero el circuito ZKP usa un **cuadrado aproximado** (más simple en Circom).

### 4.2 Application — Casos de uso

| Use case | Descripción |
|----------|-------------|
| `LoginUseCase` | Busca usuario, bcrypt, emite JWT |
| `RegisterUserUseCase` | Crea usuario (rol USER o ADMIN) |
| `ForgotPasswordUseCase` / `ResetPasswordUseCase` | Token en Redis con TTL |
| `ChangePasswordUseCase` | Cambio autenticado |
| `GenerateLocationProofUseCase` | Delega al adaptador ZKP |
| `VerifyLocationProofUseCase` | Verifica proof; actualiza usuarios concurrentes |
| `UpdateLocationUseCase` | Check Haversine; fuera de zona → destruye llaves + audit |
| `LogActionUseCase` | Registro de auditoría |

### 4.3 Infrastructure — Adaptadores

- **TypeORM** → PostgreSQL (usuarios, audit logs, migraciones)
- **RedisCacheAdapter** → cache, sesiones, rate limiting, reset password
- **CommitmentZkpAdapter** / **SnarkjsZkpAdapter** — estrategias ZKP
- **MetricsService** → Prometheus
- **RateLimitService** → límites por IP
- **validateEnv** → bloquea arranque en prod con secrets débiles

### 4.4 Presentation — HTTP

- Controllers, AuthGuard (JWT), RateLimitGuard (global)
- Login: 10 req / 5 min; global: 120 req / min
- Swagger en `/api/docs`
- Métricas HTTP por interceptor

---

## 5. Modelo de privacidad ZKP

### Problema que resuelve

Una LBSN clásica envía lat/lon al servidor. AllRight demuestra **"estoy dentro de la zona"** sin revelar coordenadas exactas.

### Adaptador `commitment` (desarrollo)

- Nonce aleatorio + commitment HMAC sobre coordenadas + userId + isInside
- Servidor verifica sin almacenar lat/lon
- Config: `ZKP_ADAPTER=commitment`
- Rápido, sin compilar Circom

### Adaptador `snarkjs` (producción)

- Groth16 real con `geofence.wasm`, `geofence_final.zkey`, `verification_key.json`
- Coordenadas entran al circuito WASM; solo salen señales públicas
- Config: `ZKP_ADAPTER=snarkjs`, `ZKP_ARTIFACTS_ENV=prod`
- Prueba generada en el **cliente** (mayor privacidad)

### Artefactos

| Entorno | Carpeta | Contribuciones |
|---------|---------|----------------|
| Desarrollo | `artifacts/dev/` | 1 |
| Producción | `artifacts/prod/` | 3+ |

Servidos en `/zkp/*` para generación en cliente.

---

## 6. Circuito Circom (geofence.circom)

### Qué prueba

Demuestra en zero-knowledge que `(userLat, userLon)` están dentro de un rectángulo definido por bounds públicos.

### Señales

| Señal | Visibilidad | Descripción |
|-------|-------------|-------------|
| `userLat`, `userLon` | Privada | Microgrados (× 1.000.000) |
| `minLat`, `maxLat`, `minLon`, `maxLon` | Pública | Bounds del cuadrado |
| `isInside` | Salida pública | 1 = dentro, 0 = fuera |

### Cálculo de bounds

```
scale = 1_000_000
centerLat = round(zone.lat × scale)
centerLon = round(zone.lon × scale)
delta = round((radiusKm / 111.32) × scale)

minLat = centerLat - delta
maxLat = centerLat + delta
minLon = centerLon - delta
maxLon = centerLon + delta
```

Default: Cali, Colombia `(3.4516, -76.5320)`, radio `0.5 km`.

### Artefactos de compilación

| Archivo | Uso |
|---------|-----|
| `geofence.r1cs` | Restricciones R1CS |
| `geofence.wasm` | Witness calculator |
| `geofence_final.zkey` | Clave de prueba (ceremonia) |
| `verification_key.json` | Verificación pública |

### Flujo snarkjs

1. Cliente: `GET /location/config` → bounds + adapter
2. Cliente: `snarkjs.groth16.fullProve(input, wasm, zkey)` — lat/lon privados
3. Cliente: `POST /location/verify` → proof + payload
4. Servidor: `groth16.verify(vKey, signals, proof)` → `{valid, isInside}`

---

## 7. Ceremonia ZKP paso a paso

Groth16 requiere **trusted setup**. La ceremonia multi-parte mitiga el riesgo: basta un contribuidor honesto que destruya su entropy.

### Fases

```
FASE 0: Powers of Tau (pot12_final.ptau — Hermez)
    ↓
FASE 1: Compilar circuito → geofence.r1cs + geofence.wasm
    ↓
FASE 2: Groth16 setup → geofence_0000.zkey
    ↓
FASE 3: Contribuciones (mín. 3 en prod)
    0000 → 0001 → 0002 → geofence_final.zkey
    ↓
FASE 4: Exportar verification_key.json + verificar
```

### Opción A — Build rápido (CI / Docker prod)

```bash
cd backend/circuits
./build-zkp-prod.sh
npm run zkp:ceremony:verify
```

`Dockerfile.prod` ejecuta esto en stage `zkp-builder`.

### Opción B — Ceremonia multi-parte real

**Paso 1 — Coordinador:**

```bash
npm run zkp:ceremony:setup
# Genera: artifacts/prod/geofence_0000.zkey
```

**Paso 2 — Contribuidores (entornos aislados):**

```bash
./ceremony/contribute.sh \
  geofence_0000.zkey geofence_0001.zkey "Org Security Team"
```

Cadena: `0000 → 0001 → 0002 → geofence_final.zkey`

**Paso 3 — Exportar y verificar:**

```bash
snarkjs zkey export verificationkey geofence_final.zkey verification_key.json
npm run zkp:ceremony:verify
```

**Paso 4 — Automatizado local (validación):**

```bash
npm run zkp:ceremony:run
```

### Reglas de seguridad

- Nunca commitear `geofence_final.zkey` de prod
- Cada contribuidor destruye su entropy
- Rotar zkey si hay sospecha de compromiso
- `ZKP_ARTIFACTS_ENV=prod` en servidor de producción

---

## 8. API REST

### Auth (`/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Email + password → JWT |
| POST | `/auth/forgot-password` | No | Token reset en Redis (+ email SMTP si configurado) |
| POST | `/auth/reset-password` | No | Restablecer con token |
| POST | `/auth/change-password` | JWT | Cambio autenticado |

### Users (`/users`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/users` | Registro de usuario |

### Location (`/location`) — JWT requerido

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/location/config` | Adapter, zona, bounds ZKP |
| GET | `/location/history` | Historial proofs ZKP |
| POST | `/location/prove` | Generar LocationProof |
| POST | `/location/prove/record` | Registrar proof cliente (snarkjs) |
| POST | `/location/verify` | Verificar proof |

### Security (`/security`) — JWT requerido

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/security/check-location` | Check Haversine; fuera → destrucción de llaves |
| POST | `/security/panic` | Botón de pánico SOS |
| GET | `/security/panic/active` | Alerta activa |
| POST | `/security/panic/:id/resolve` | Cancelar falsa alarma |

### Proximity (`/proximity`) — JWT requerido

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/proximity/zones` | Beacons whitelist |
| GET | `/proximity/status` | Último BLE |
| GET | `/proximity/hybrid` | Fusión GPS + BLE |
| POST | `/proximity/gps` | Reportar presencia GPS |
| POST | `/proximity/report` | Reportar detección BLE |

### Notifications (`/notifications`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/notifications/vapid-public-key` | Clave VAPID |
| POST | `/notifications/subscribe` | Suscripción Web Push (JWT) |

### Health & Metrics

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/health/ready` | Readiness (DB + Redis) |
| GET | `/metrics` | Prometheus scrape (token en prod) |
| GET | `/api/docs` | Swagger UI |

---

## 9. Variables de entorno

| Variable | Desarrollo | Producción |
|----------|------------|------------|
| `ZKP_ADAPTER` | `commitment` | `snarkjs` |
| `ZKP_ARTIFACTS_ENV` | `dev` | `prod` |
| `DB_SYNCHRONIZE` | `true` | `false` (obligatorio) |
| `DB_MIGRATIONS_RUN` | `false` | `true` |
| `JWT_SECRET` | cualquiera | ≥32 chars, único |
| `ZKP_PEPPER` | dev pepper | ≥32 chars, único |
| `GEOFENCE_LAT/LON/RADIUS_KM` | Cali default | configurable |
| `RATE_LIMIT_MAX` | 120 | 120 |
| `RATE_LIMIT_LOGIN_MAX` | 10 | 10 |
| `METRICS_TOKEN` | opcional | ≥16 chars (obligatorio en prod) |
| `METRICS_ALLOW_PRIVATE` | — | `true` para scrape interno |
| `SMTP_HOST` | vacío (= log consola) | servidor SMTP real |
| `SMTP_PORT` | 587 | 587 / 465 |
| `SMTP_USER` / `SMTP_PASS` | — | credenciales |
| `SMTP_FROM` | noreply@allright.app | remitente |
| `PANIC_NOTIFY_EMAIL` | — | buzón ops para SOS |
| `APP_URL` | http://localhost:3000 | URL pública (reset links) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | — | Web Push |

Guía SMTP: `Diagramas/SMTP-SETUP.md`

---

## 10. Frontend móvil

Stack: **React + Vite** (`frontend/`), build a `backend/public`. Opcional: **Capacitor** (Android/iOS) para BLE nativo.

| Pantalla | Ruta |
|----------|------|
| Login | `/` |
| App (mapa + ZKP) | `/app` (Vite) / `app.html` (legacy) |
| HTTPS (GPS móvil) | `https://<host>:3443` (`npm run docker:prod:https`) |

### Funcionalidades

- Mapa Leaflet + geofence
- Geolocalización GPS + fusión híbrida BLE
- Botón de pánico SOS
- Escaneo BLE (Web Bluetooth / simulador / Capacitor)
- Modo snarkjs: proof Groth16 en dispositivo
- Historial de proofs

JWT en `localStorage`. Docs: `Diagramas/FASE-E-*.md`, `Diagramas/SMTP-SETUP.md`.

---

## 11. Guía de implementación por entorno

### A. Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev:infra    # Postgres :5433, Redis, Prometheus, Grafana
npm run dev:api      # NestJS :3000
```

Tests:

```bash
npm run test -w backend
npm run test:e2e
```

### B. Docker Compose (stack completo)

```bash
docker compose up -d --build
```

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

### C. Producción Docker

```powershell
npm run setup:prod          # Genera .env.production
cd backend
npm run zkp:build:prod      # Ceremonia ZKP
npm run zkp:ceremony:verify
npm run docker:prod         # Desde raíz
```

### D. Kubernetes (Kind)

```bash
cp k8s/secret.yaml.example k8s/secret.yaml
npm run k8s:deploy
# API: http://127.0.0.1:30080
npm run k8s:teardown
```

### E. Terraform (multi-cloud)

```bash
cd infra/terraform/{aws|gcp|azure}
terraform init
terraform plan -var="..."
terraform apply
```

---

## 12. Despliegue AWS (ECS Fargate)

### Recursos Terraform

- ECS Cluster `allright-cluster`
- Task Definition Fargate (256 CPU, 512 MB, puerto 3000)
- ECS Service (`desired_count` configurable)
- Security Group (TCP 3000)
- IAM Role de ejecución

### Pasos

```bash
# 1. Build y push a ECR
docker build -f backend/Dockerfile.prod -t allright-api:latest ./backend
docker tag allright-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/allright-api:latest
docker push ...

# 2. Terraform
cd infra/terraform/aws
terraform init
terraform apply -var="ecr_image=..." -var="desired_count=2"
```

### Variables adicionales requeridas (prod real)

Configurar vía Secrets Manager o task definition:

`DB_*`, `REDIS_*`, `JWT_SECRET`, `ZKP_PEPPER`, `ZKP_ADAPTER=snarkjs`, `GEOFENCE_*`

Postgres y Redis: RDS + ElastiCache (externos al módulo base).

---

## 13. Despliegue GCP (Cloud Run)

### Recursos Terraform

- Cloud Run v2 Service `allright-api`
- IAM público (`allUsers` invoker)
- HTTPS automático

### Pasos

```bash
gcloud auth application-default login
docker build -f backend/Dockerfile.prod -t allright-api:latest ./backend
docker tag ... us-central1-docker.pkg.dev/PROJECT/allright/allright-api:latest
docker push ...

cd infra/terraform/gcp
terraform apply \
  -var="gcp_project=YOUR_PROJECT" \
  -var="container_image=..."
```

Output: `service_url = https://allright-api-xxxxx-uc.a.run.app`

Servicios complementarios: Cloud SQL (PostgreSQL), Memorystore (Redis), Secret Manager.

---

## 14. Kubernetes (Kind)

Cluster `allright`: 1 control-plane + 2 workers.

- API: 2 réplicas, podAntiAffinity
- Postgres, Redis en manifiestos
- ZKP prod (`snarkjs`)
- NodePort `:30080`

### Pruebas de carga (Fase B)

| Prueba | VUs | p95 | Error rate | Resultado |
|--------|-----|-----|------------|-----------|
| Health | 20 | 98 ms | 0% | PASS |
| 100 usuarios | 100 | 174 ms | 0% | PASS |
| 500 in-cluster | 500 | 115 ms | 0% | PASS |

```bash
npm run loadtest:100
npm run loadtest:500:incluster   # Recomendado en Windows
```

---

## 15. Observabilidad y pruebas

### Métricas

- `GET /metrics` — endpoint Prometheus
- Dashboard **AllRight Overview** en Grafana (auto-provisioned)
- Métricas ZKP: tiempo generación/verificación, usuarios concurrentes

### CI (GitHub Actions)

1. Lint + unit tests + build
2. E2E Playwright (viewport móvil)
3. Docker build

### Scripts de carga (k6)

```bash
npm run loadtest:health
npm run loadtest:100
npm run loadtest:500
npm run loadtest:zkp
```

---

## 16. Seguridad

| Mecanismo | Descripción |
|-----------|-------------|
| Rate limiting | Redis, global + login estricto |
| JWT | Bearer token, expiración configurable |
| bcrypt | Hash de contraseñas |
| validateEnv | Bloquea prod con secrets débiles |
| Destrucción de llaves | Fuera de geofence → borra cache + audit |
| Ceremonia ZKP | Multi-contribución Groth16 |
| Pentesting | `npm run security:pentest` |
| Forensic audit | `npm run security:forensic` |
| Burp Suite | `scripts/security/BURP-SUITE.md` |

---

## 17. Estructura del repositorio

```
AllRight/
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── circuits/
│   │   ├── geofence.circom
│   │   ├── artifacts/dev|prod/
│   │   └── ceremony/
│   ├── public/
│   ├── Dockerfile
│   └── Dockerfile.prod
├── public/
├── e2e/
├── infra/
│   ├── docker/
│   ├── prometheus/
│   ├── grafana/
│   └── terraform/ (aws, gcp, azure)
├── k8s/
├── scripts/
├── Diagramas/
├── docker-compose.yml
└── package.json
```

---

## 18. Checklist de producción

```
□ npm run setup:prod → .env.production
□ Ceremonia ZKP multi-parte verificada
□ docker build -f Dockerfile.prod
□ Push imagen al registry cloud
□ Provisionar Postgres + Redis
□ Configurar env vars (JWT, ZKP, DB, geofence)
□ terraform apply / docker:prod / k8s:deploy
□ GET /health/ready OK
□ GET /metrics en Prometheus
□ Flujo: login → prove → verify → check-location
□ loadtest:100 contra URL prod
```

---

## Comparativa de entornos

| Aspecto | Local | Docker | Prod Docker | K8s | AWS/GCP |
|---------|-------|--------|-------------|-----|---------|
| ZKP | commitment | commitment | snarkjs | snarkjs | snarkjs |
| DB sync | true | true | false+migrations | false | false |
| Ceremonia | no | no | sí | sí | sí |
| HA | no | restart | restart | 2 réplicas | auto-scale |
| HTTPS | no | no | no | no | sí (cloud) |

---

*Documento generado a partir del repositorio AllRight — LBSN con privacidad ZKP, cloud-agnostic.*
