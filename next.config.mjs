/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Neon driver adapter's ws/native deps out of the webpack bundle —
  // bundling breaks ws's optional bufferutil/utf-8-validate native bindings.
  experimental: {
    serverComponentsExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon", "ws"],
  },
};
export default nextConfig;
