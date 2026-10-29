
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  serverExternalPackages: ["@react-pdf/renderer", "pdfkit"],

  outputFileTracingIncludes: {
    "/api/invoices/**": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
    ],
  },

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
