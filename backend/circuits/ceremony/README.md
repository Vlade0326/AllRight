# Ceremonia ZKP de producción — AllRight

## Objetivo

Generar `geofence_final.zkey` con **múltiples contribuciones** para que ninguna
parte única conozca el toxic waste del setup Groth16.

## Artefactos

| Entorno | Carpeta | Uso |
|---------|---------|-----|
| Desarrollo | `artifacts/dev/` | Local, 1 contribución |
| Producción | `artifacts/prod/` | Deploy, 3+ contribuciones |

## Build rápido (CI / Docker prod)

```bash
cd backend/circuits
./build-zkp-prod.sh
```

## Ceremonia multi-parte (recomendado en producción real)

1. **Coordinador** — setup inicial (sin contribuciones):
   ```bash
   npm run zkp:ceremony:setup
   # o: ./build-zkp-prod-setup.sh
   ```

2. **Contribuidores A, B, C** — cada uno en entorno aislado:
   ```bash
   ./ceremony/contribute.sh artifacts/prod/geofence_0000.zkey \
     artifacts/prod/geofence_0001.zkey "Org Security Team"
   ```

3. **Automatizado local** (3 contribuciones en secuencia, para validación):
   ```bash
   npm run zkp:ceremony:run
   ```

4. **Verificación**:
   ```bash
   npm run zkp:ceremony:verify
   ```

> `build-zkp-prod.sh` (usado por Docker prod) simula 3 contribuciones en un solo build.
> Para ceremonia real distribuida, usar `build-zkp-prod-setup.sh` + `contribute.sh`.

## Reglas de seguridad

- Nunca commitear `geofence_final.zkey` de producción en repos públicos.
- Cada contribuidor debe destruir su entropy tras contribuir.
- Usar `ZKP_ARTIFACTS_ENV=prod` en el servidor de producción.
- Rotar zkey si se sospecha compromiso de la ceremonia.
