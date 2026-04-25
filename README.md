# FlowChain MVP

## Qué incluye
- Landing/demo en una sola página
- Flujo de ruta alternativa -> reward -> claim
- Funciona en modo simulación por defecto
- Lista para conectar MetaMask
- Soporta contrato real si luego agregas `state.contractAddress` en `index.html`

## Cómo correrlo
```bash
cd flowchain-mvp
python3 -m http.server 3000
```

Luego abre:
- http://localhost:3000

## Demo narrativa
1. Mostrar Ruta A vs Ruta B
2. Elegir Ruta B
3. Click en `Aceptar ruta alternativa`
4. Click en `Conectar wallet` (opcional)
5. Click en `Claim reward`
6. Mostrar hash / ledger / impacto
