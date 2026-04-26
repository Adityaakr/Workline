import type { NextConfig } from "next";

// Always allow the host pinned in AUTH_URL (whatever ngrok subdomain the
// dev currently has), plus a wildcard for any *.ngrok-free.app /
// *.ngrok.app / *.ngrok.io subdomain so dev mode doesn't break every
// time the tunnel rotates and we forget to update .env.local.
const authUrl = process.env.AUTH_URL;
const allowedDevOrigins = [
  ...(authUrl ? [new URL(authUrl).host] : []),
  "*.ngrok-free.app",
  "*.ngrok.app",
  "*.ngrok.io",
  "*.lhr.life",
  "*.localhost.run",
];

const nextConfig: NextConfig = {
  images: {
    domains: ["static.usernames.app-backend.toolsforhumanity.com"],
  },
  allowedDevOrigins,
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
