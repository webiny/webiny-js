import type { StorybookConfig } from "storybook-react-rsbuild";
import { dirname, join } from "node:path";
import path from "path";
import { fileURLToPath } from "node:url";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
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
        name: getAbsolutePath("storybook-react-rsbuild"),
        options: {}
    },

    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true
    },

    rsbuildFinal: async config => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            "~": path.resolve(import.meta.dirname, "../src")
        };

        config.tools = config.tools || {};
        config.tools.postcss = (_, { addPlugins }) => {
            addPlugins(tailwindcss);
        };

        config.plugins = [
            ...(config.plugins || []),
            pluginSvgr({
                svgrOptions: {
                    exportType: "named",
                    namedExport: "ReactComponent"
                },
                mixedImport: true,
                include: /packages\/icons\/.*\.svg$/
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
