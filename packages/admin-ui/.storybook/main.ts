import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "node:path";
import path from "path";
import { fileURLToPath } from "node:url";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/postcss";

function getAbsolutePath(value: string): any {
    return dirname(fileURLToPath(import.meta.resolve(join(value, "package.json"))));
}

const config: StorybookConfig = {
    stories: [
        "../docs/stories/**/*.mdx",
        "../src/**/*.mdx",
        "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
    ],

    staticDirs: ["../assets"],

    addons: [getAbsolutePath("@storybook/addon-a11y"), getAbsolutePath("@storybook/addon-docs")],

    framework: {
        name: getAbsolutePath("@storybook/react-vite"),
        options: {}
    },

    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true
    },

    viteFinal: async config => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            "~": path.resolve(import.meta.dirname, "../src")
        };

        config.css = {
            ...config.css,
            postcss: {
                plugins: [tailwindcss]
            }
        };

        config.plugins = [
            ...(config.plugins || []),
            svgr({
                svgrOptions: {
                    exportType: "named",
                    namedExport: "ReactComponent"
                },
                include: "**/packages/icons/**/*.svg"
            })
        ];

        return config;
    },

    features: {
        controls: true,
        storyStoreV7: true
    }
};

export default config;
