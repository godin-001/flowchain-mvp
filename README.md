# FlowChain MVP

## Qué incluye
- App en Next.js con App Router
- Demo de una sola página
- Flujo de ruta alternativa -> reward -> claim
- WalletConnect-first con project ID configurado
- Fallback de simulación para no romper la demo
- Smart contract Solidity incluido
- Soporta contrato real con `NEXT_PUBLIC_CONTRACT_ADDRESS`

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

## Smart contract
Compilar:
```bash
npm run compile:contract
```

Desplegar en Base Sepolia:
```bash
cp .env.example .env.local
# agrega DEPLOYER_PRIVATE_KEY y, si quieres, BASE_SEPOLIA_RPC_URL
npm run deploy:base-sepolia
```

Luego pega la address resultante en `.env.local`:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532
```

Y vuelve a levantar la app:
```bash
npm run dev
```

## Demo narrativa
1. Mostrar Ruta A vs Ruta B
2. Elegir Ruta B
3. Click en `Aceptar ruta alternativa`
4. Click en `Conectar wallet` con WalletConnect (opcional)
5. Click en `Claim reward`
6. Mostrar hash / ledger / impacto
