import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Política de contenido: solo se permite cargar recursos del propio sitio.
// - 'unsafe-inline' en script-src es necesario porque Next.js inserta scripts en línea para
//   hidratar páginas estáticas (un nonce exigiría renderizado dinámico).
// - En desarrollo no se aplica, porque React necesita 'unsafe-eval' para sus herramientas de debug.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde otros dispositivos de la red local (ej. el celular).
  // Sin esto, Next.js bloquea los scripts y la página queda cargando para siempre.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // Genera una carpeta mínima y autosuficiente para la imagen de Docker.
  output: "standalone",
  // No revela con qué tecnología está hecho el sitio (cabecera X-Powered-By).
  poweredByHeader: false,
  // No publica el código fuente original en producción.
  productionBrowserSourceMaps: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
