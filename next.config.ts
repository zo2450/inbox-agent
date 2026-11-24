import type { NextConfig } from "next";

// Only these sites may show the demo in an iframe.
const FRAME_ANCESTORS = "'self' https://zohair-portfolio-eta.vercel.app http://localhost:3000 http://localhost:3002";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Content-Security-Policy", value: `frame-ancestors ${FRAME_ANCESTORS}` }] }];
  },
};

export default nextConfig;
