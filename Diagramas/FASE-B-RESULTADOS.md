# Fase B — Resultados de carga (Kind, 3 nodos)

Cluster: `allright` (1 control-plane + 2 workers)  
API: 2 réplicas con `podAntiAffinity`, ZKP prod (`snarkjs`)

## Resumen

| Prueba | VUs | Duración | p95 latencia | Error rate | Checks | Resultado |
|--------|-----|----------|--------------|------------|--------|-----------|
| Health (local) | 20 | 30s | 98.84 ms | 0% | 100% | ✅ PASS |
| 100 usuarios (local) | 100 | 2 min | 174.44 ms | 0% | 100% | ✅ PASS |
| 500 usuarios (in-cluster) | 500 | 6 min | **115 ms** | **0%** | **100%** | ✅ PASS |

La prueba local de 500 VUs vía `port-forward` no es fiable en Windows (colapsa ~35% de requests). Usar `npm run loadtest:500:incluster` para medición real.

## Comandos

```bash
npm run k8s:deploy          # Kind + manifiestos
npm run loadtest:100        # 100 VUs contra localhost:30080
npm run loadtest:500:incluster  # 500 VUs dentro del cluster (recomendado)
npm run k8s:teardown        # Eliminar cluster
```

## Nota Windows/Kind

En Kind con Docker Desktop, el NodePort no se expone automáticamente. `kind-cluster-config.yaml` incluye `extraPortMappings` para `:30080`. Tras recrear el cluster (`k8s:teardown` + `k8s:deploy`), la API queda en `http://127.0.0.1:30080` sin port-forward.

Para pruebas de alta concurrencia, usar `loadtest:500:incluster`.
