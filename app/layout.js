import Script from 'next/script';

export const metadata = {
  title: 'FlowChain — Coordinación incentivada para movilidad urbana',
  description: 'Coordinación incentivada para movilidad urbana',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.12),_transparent_25%)]" />
        {children}
      </body>
    </html>
  );
}
