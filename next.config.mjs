/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces .next/standalone with only the files the server actually needs,
  // which is what the Dockerfile copies into the runtime image.
  output: "standalone",
  // Keep the Neon driver adapter's ws/native deps out of the webpack bundle —
  // bundling breaks ws's optional bufferutil/utf-8-validate native bindings.
  // puppeteer-core is here for the same reason: it must not be bundled, or
  // Chromium's launcher can't resolve its own files at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      "@neondatabase/serverless",
      "@prisma/adapter-neon",
      "ws",
      "puppeteer-core",
      "nodemailer",
      // Ships a compressed Chromium build it locates relative to its own
      // __dirname; bundling would break that path resolution the same way
      // it would break puppeteer-core's.
      "@sparticuz/chromium",
    ],
  },
};
export default nextConfig;
