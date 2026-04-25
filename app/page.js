'use client';

import { useMemo, useState } from 'react';

const PROJECT_ID = '571aaea1a336af46ff3121ae225db60a';
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532);
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const CONTRACT_ABI = [
  'function claimReward(bytes32 routeId, uint256 amount) public',
  'function rewards(address) public view returns (uint256)',
  'function claimedRouteIds(address, bytes32) public view returns (bool)'
];

function randomHash() {
  const chars = 'abcdef0123456789';
  let hash = '0x';
  for (let i = 0; i < 64; i += 1) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function HomePage() {
  const [selectedRoute, setSelectedRoute] = useState('B');
  const [reward, setReward] = useState(0);
  const [impact, setImpact] = useState(0);
  const [contributions, setContributions] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [walletHint, setWalletHint] = useState('Demo lista con o sin wallet. Conexión principal: WalletConnect.');
  const [decisionLabel, setDecisionLabel] = useState('Acepta la ruta alternativa para desbloquear recompensa');
  const [txStatus, setTxStatus] = useState('Esperando una contribución...');
  const [txHash, setTxHash] = useState('—');
  const [claimedOnChain, setClaimedOnChain] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [chainBadge, setChainBadge] = useState({ text: 'Simulación creíble', className: 'bg-amber-400/15 text-amber-200' });
  const [acceptLocked, setAcceptLocked] = useState(false);
  const [claimLocked, setClaimLocked] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [walletProvider, setWalletProvider] = useState(null);
  const [ethersProvider, setEthersProvider] = useState(null);
  const walletStatus = useMemo(() => (wallet ? shortAddress(wallet) : 'No conectada'), [wallet]);
  const rewardRouteId = useMemo(() => `FLOWCHAIN-${selectedRoute}`, [selectedRoute]);
  const isContractReady = Boolean(CONTRACT_ADDRESS);

  function selectRoute(route) {
    setSelectedRoute(route);
    setDecisionLabel(
      route === 'B'
        ? 'Ruta B seleccionada: cooperación urbana con recompensa'
        : 'Ruta A seleccionada: decisión individual sin incentivo'
    );
  }

  function addLedgerEntry(entry) {
    setLedger((current) => [entry, ...current]);
  }

  function unlockReward() {
    if (selectedRoute !== 'B') {
      setDecisionLabel('Para demostrar impacto sistémico, elige la Ruta B.');
      return;
    }

    setReward(10);
    setImpact(23);
    setContributions((count) => count + 1);
    setTxStatus('Reward desbloqueado. Lista para reclamar con WalletConnect o simulación.');
    setClaimLocked(false);
    setAcceptLocked(true);
  }

  async function connectWallet() {
    setConnecting(true);

    try {
      const [{ default: EthereumProvider }, ethersModule] = await Promise.all([
        import('@walletconnect/ethereum-provider'),
        import('ethers')
      ]);

      let provider = walletProvider;
      if (!provider) {
        provider = await EthereumProvider.init({
          projectId: PROJECT_ID,
          chains: [CHAIN_ID],
          optionalChains: [CHAIN_ID],
          showQrModal: true,
          methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData', 'eth_sign'],
          optionalMethods: ['eth_accounts', 'eth_requestAccounts', 'wallet_switchEthereumChain'],
          rpcMap: {
            [CHAIN_ID]: 'https://sepolia.base.org'
          },
          metadata: {
            name: 'FlowChain',
            description: 'Coordinación incentivada para movilidad urbana',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://flowchain-mvp.vercel.app',
            icons: ['https://flowchain-mvp.vercel.app/favicon.ico']
          }
        });
        setWalletProvider(provider);
      }

      await provider.enable();
      const nextEthersProvider = new ethersModule.ethers.providers.Web3Provider(provider);
      const signer = nextEthersProvider.getSigner();
      const address = await signer.getAddress();

      setEthersProvider(nextEthersProvider);
      setWallet(address);
      setWalletHint(
        isContractReady
          ? 'WalletConnect activo. El contrato está configurado para claim on-chain.'
          : 'WalletConnect activo. Falta configurar NEXT_PUBLIC_CONTRACT_ADDRESS para el claim on-chain.'
      );
      setChainBadge({ text: 'WalletConnect listo', className: 'bg-cyan-400/15 text-cyan-200' });

      if (isContractReady) {
        const { ethers } = await import('ethers');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, nextEthersProvider);
        const currentRewards = await contract.rewards(address);
        setClaimedOnChain(Number(currentRewards.toString()));
      }
    } catch (error) {
      setWalletHint('WalletConnect no pudo conectarse en este intento. La demo sigue viva con simulación.');
    } finally {
      setConnecting(false);
    }
  }

  async function claimReward() {
    const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    if (ethersProvider && wallet && CONTRACT_ADDRESS) {
      try {
        const { ethers } = await import('ethers');
        const signer = ethersProvider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const routeId = ethers.utils.id(rewardRouteId);
        const alreadyClaimed = await contract.claimedRouteIds(wallet, routeId);

        if (alreadyClaimed) {
          setTxStatus('Esa ruta ya fue reclamada por esta wallet. Se mantiene la demo y evitamos doble claim.');
          setClaimLocked(true);
          return;
        }

        const tx = await contract.claimReward(routeId, reward);

        setTxStatus('Transacción enviada por WalletConnect. Esperando confirmación...');
        setTxHash(tx.hash);
        setChainBadge({ text: 'On-chain real', className: 'bg-emerald-400/15 text-emerald-200' });

        await tx.wait();

        setTxStatus('Reward registrada on-chain correctamente.');
        const updatedRewards = await contract.rewards(wallet);
        setClaimedOnChain(Number(updatedRewards.toString()));
        addLedgerEntry({
          title: 'Contribución registrada on-chain',
          body: `El usuario aceptó la ruta alternativa y reclamó ${reward} FLOW vía WalletConnect para ${rewardRouteId}.`,
          hash: tx.hash,
          time
        });
        setClaimLocked(true);
        return;
      } catch (error) {
        setTxStatus('Falló la escritura on-chain. Se activa fallback de simulación para no romper la demo.');
      }
    }

    const hash = randomHash();
    setChainBadge({ text: 'Simulación creíble', className: 'bg-amber-400/15 text-amber-200' });
    setTxStatus('Reward registrada en settlement layer simulado.');
    setTxHash(hash);
    addLedgerEntry({
      title: 'Contribución registrada',
      body: `El usuario aceptó la ruta alternativa y desbloqueó ${reward} FLOW como incentivo verificable.`,
      hash,
      time
    });
    setClaimLocked(true);
  }

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Coordinación incentivada para movilidad urbana
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">FlowChain</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300 md:text-xl">
            No optimizamos un coche. <span className="font-semibold text-white">Coordinamos el comportamiento de muchos</span>{' '}
            para reducir congestión con incentivos verificables.
          </p>
        </div>

        <div className="min-w-[280px] rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-sm text-slate-400">Wallet</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">{walletStatus}</div>
          <button
            id="connectWalletBtn"
            onClick={connectWallet}
            disabled={connecting}
            className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {connecting ? 'Abriendo WalletConnect...' : 'Conectar wallet'}
          </button>
          <div className="mt-3 text-xs text-slate-400">{walletHint}</div>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Escenario urbano</div>
              <h2 className="mt-2 text-2xl font-bold">Descongestionar un corredor vial en tiempo real</h2>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              Estado de red: <span className="font-bold">Presión alta</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => selectRoute('A')}
              className={`rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-left transition hover:scale-[1.01] ${selectedRoute === 'A' ? 'ring-2 ring-rose-300/40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-rose-200">Ruta A</span>
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs text-rose-200">Congestionada</span>
              </div>
              <div className="mt-4 text-3xl font-black">18 min</div>
              <p className="mt-3 text-sm text-slate-300">La opción egoísta: más rápida para una persona, peor para el sistema.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] bg-rose-400" />
              </div>
              <div className="mt-2 text-xs text-slate-400">Índice de congestión: 82/100</div>
            </button>

            <button
              onClick={() => selectRoute('B')}
              className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-left transition hover:scale-[1.01] ${selectedRoute === 'B' ? 'ring-2 ring-emerald-300/40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-200">Ruta B</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">Recomendada</span>
              </div>
              <div className="mt-4 text-3xl font-black">22 min</div>
              <p className="mt-3 text-sm text-slate-300">Una decisión individual un poco menos óptima que mejora el flujo colectivo.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[39%] bg-emerald-400" />
              </div>
              <div className="mt-2 text-xs text-slate-400">Índice de congestión: 39/100</div>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-slate-400">Decisión del usuario</div>
                <div className="mt-1 text-xl font-bold">{decisionLabel}</div>
              </div>
              <button
                onClick={unlockReward}
                disabled={acceptLocked}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {acceptLocked ? 'Ruta alternativa aceptada' : 'Aceptar ruta alternativa'}
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Reward</div>
                <div className="mt-2 text-3xl font-black text-cyan-300">{reward} FLOW</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Impacto sistémico</div>
                <div className="mt-2 text-3xl font-black text-emerald-300">{impact}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Contribuciones</div>
                <div className="mt-2 text-3xl font-black text-violet-300">{contributions}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              {isContractReady
                ? `Contrato listo en ${CONTRACT_ADDRESS.slice(0, 8)}...${CONTRACT_ADDRESS.slice(-6)}`
                : 'Contrato no configurado aún. La app sigue operando en modo demo + fallback.'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Settlement layer</h3>
              <span className={`rounded-full px-3 py-1 text-xs ${chainBadge.className}`}>{chainBadge.text}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">Blockchain no guía el vehículo. Registra incentivos, confianza y trazabilidad.</p>

            <button
              onClick={claimReward}
              disabled={claimLocked}
              className="mt-5 w-full rounded-xl bg-violet-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Claim reward
            </button>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Registro de transacción</div>
              <div className="mt-2 text-sm text-slate-300">{txStatus}</div>
              <div className="mt-3 break-all font-mono text-xs text-cyan-300">{txHash}</div>
              {claimedOnChain !== null ? (
                <div className="mt-3 text-xs text-emerald-300">Rewards acumuladas on-chain: {claimedOnChain} FLOW</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold">Por qué esto importa</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• El tráfico no es solo rutas. Es alineación de incentivos.</li>
              <li>• Cada decisión individual puede generar beneficio sistémico.</li>
              <li>• La recompensa verificable vuelve visible la cooperación urbana.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-sm text-slate-400">Ledger local de demo</div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {ledger.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-slate-500">Sin eventos todavía.</div>
              ) : (
                ledger.map((entry) => (
                  <div key={`${entry.hash}-${entry.time}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-semibold text-white">{entry.title}</div>
                      <div className="text-xs text-slate-500">{entry.time}</div>
                    </div>
                    <div className="mt-2 text-slate-300">{entry.body}</div>
                    <div className="mt-2 break-all font-mono text-xs text-cyan-300">{entry.hash}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
