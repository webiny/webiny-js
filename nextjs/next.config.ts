import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    // this will allow site to be framed under builder.io for wysiwyg editing
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors http://localhost:3001"
                        // value: 'frame-ancestors https://*.builder.io https://builder.io',
                    }
                ]
            }
        ];
    },
    webpack: (config, context) => {
        config.externals.push({
            "thread-stream": "commonjs thread-stream"
        });
        return config;
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,

    },
};

export default nextConfig;
