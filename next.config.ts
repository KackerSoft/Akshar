import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core dynamically resolves its browser binary; keep it out of
  // the server bundle so that resolution works at runtime.
  serverExternalPackages: ["playwright-core"],
};

export default nextConfig;
