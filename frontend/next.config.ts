import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["@phosphor-icons/react"],
	},
	images: {
		domains: ["api.dicebear.com", "picsum.photos"],
		unoptimized: true,
	},
};

export default nextConfig;
