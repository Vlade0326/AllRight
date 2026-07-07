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

1. **Coordinador** ejecuta setup inicial:
   ```bash
   ./build-zkp-prod.sh   # genera geofence_0000.zkey
   ```

2. **Contribuidor A** (entorno aislado):
   ```bash
   ./ceremony/contribute.sh artifacts/prod/geofence_0000.zkey \
     artifacts/prod/geofence_0001.zkey "Org Security Team"
   ```

3. **Contribuidor B** y **C** repiten con el zkey anterior.

4. El último renombra su salida a `geofence_final.zkey`.

5. **Verificación**:
   ```bash
   ./ceremony/verify-ceremony.sh
   ```

## Reglas de seguridad

- Nunca commitear `geofence_final.zkey` de producción en repos públicos.
- Cada contribuidor debe destruir su entropy tras contribuir.
- Usar `ZKP_ARTIFACTS_ENV=prod` en el servidor de producción.
- Rotar zkey si se sospecha compromiso de la ceremonia.
