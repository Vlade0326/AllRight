# Fase E5 — Capacitor BLE nativo (iOS / Android)

## Objetivo

Escaneo iBeacon en **iOS** (Safari no soporta Web Bluetooth) y Android nativo, reutilizando la misma UI React.

## Arquitectura

```
BleProximity
   └─ startIBeaconScan()
         ├─ Capacitor.isNativePlatform() → @capacitor-community/bluetooth-le
         └─ else → Web Bluetooth (Chrome)
```

| Módulo | Rol |
|--------|-----|
| `scanCapacitor.ts` | `BleClient.requestLEScan` + parse manufacturer data |
| `scanWebBluetooth.ts` | E3 browser path |
| `scanBeacons.ts` | Router plataforma |
| `capacitor.config.ts` | appId `app.allright.mobile` |

## Requisitos

- Node 20+
- **iOS:** macOS + Xcode 15+ + CocoaPods
- **Android:** Android Studio (también en Windows)
- API AllRight alcanzable por HTTPS desde el dispositivo (`docker:prod:https` o cloud)

## Comandos

```bash
# 1. Dependencias (desde raíz del monorepo)
npm install

# 2. Build web embebido en Capacitor (frontend/dist)
npm run build:cap -w frontend

# 3. Añadir plataformas (una vez; iOS solo en Mac)
npm run cap:add:android -w frontend
npm run cap:add:ios -w frontend          # macOS

# 4. Sync + abrir IDE
npm run cap:android -w frontend
npm run cap:ios -w frontend              # macOS
```

Permisos: ver `frontend/native-permissions.md` (copiar claves a Info.plist tras `cap add ios`).

## Configurar URL de API

En desarrollo, el WebView debe hablar con tu API:

Opción A — servidor embebido apunta a LAN HTTPS:

```ts
// capacitor.config.ts → server.url (solo debug)
server: { url: 'https://192.168.1.10:3443', cleartext: false }
```

Opción B — build estático en `dist/` + `apiFetch` relativo si sirves API y assets juntos (prod cloud).

## Flujo en dispositivo

1. Abrir app AllRight → login
2. Panel BLE → **Escanear iBeacon real**
3. Beacon físico (UUID seed `f7826da6-…`) → report → badge híbrido E4

## Pruebas

| Entorno | Cómo |
|---------|------|
| Browser | Simulador + Web Bluetooth (E2/E3) |
| Android | `cap:android` + beacon |
| iOS | Mac + `cap:ios` + beacon |

Unit: `npm run test:frontend` (parser iBeacon; Capacitor mockeable en E2E nativo futuro).

## Limitaciones

- Generar proyecto `ios/` requiere macOS (no se commitea el scaffold aquí por defecto)
- Background BLE / región iBeacon nativa Apple (CoreLocation) no incluida — escaneo en foreground
- App Store: declarar uso de Bluetooth en privacy nutrition labels

## Estado Fase E

| Ítem | Estado |
|------|--------|
| E1 Pánico | ✅ |
| E2 BLE PoC | ✅ |
| E3 iBeacon Web | ✅ |
| E4 Híbrido GPS+BLE | ✅ |
| **E5 Capacitor** | ✅ código + docs (build iOS en Mac) |
