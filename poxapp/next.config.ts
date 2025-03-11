import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/uploads/:path*", // Serve files from /uploads/ in the URL
                destination: "/api/upload/:path*", // Redirect to an API route
            },
        ];
    },
};

export default nextConfig;
