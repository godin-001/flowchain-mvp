# FlowChain MVP

## Qué incluye
- App en Next.js con App Router
- Demo de una sola página
- Flujo de ruta alternativa -> reward -> claim
- WalletConnect-first con project ID configurado
- Fallback de simulación para no romper la demo
- Soporta contrato real si luego agregas `contractAddress` en `app/page.js`

## Cómo correrlo
```bash
cd flowchain-mvp
npm install
npm run dev
```

Luego abre:
- http://localhost:3000

## Build de producción
```bash
npm run build
npm start
```

## Demo narrativa
1. Mostrar Ruta A vs Ruta B
2. Elegir Ruta B
3. Click en `Aceptar ruta alternativa`
4. Click en `Conectar wallet` con WalletConnect (opcional)
5. Click en `Claim reward`
6. Mostrar hash / ledger / impacto
