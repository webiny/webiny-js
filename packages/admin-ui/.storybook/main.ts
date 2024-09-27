import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import tailwindcss from "tailwindcss";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return path.dirname(require.resolve(path.join(value, "package.json")));
}

const config: StorybookConfig = {
    stories: ["../docs/stories/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    staticDirs: ["../assets"],
    addons: [
        getAbsolutePath("@storybook/addon-a11y"),
        {
            name: "@storybook/addon-essentials",
            options: {
                controls: true,
                code: true
            }
        }
    ],
    framework: {
        name: getAbsolutePath("@storybook/react-webpack5"),
        options: {}
    },
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true
    },
    webpackFinal: async config => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            "~": path.resolve(__dirname, "../src")
        };

        // Add custom style handling
        config.module?.rules?.push({
            test: /\.s[ac]ss$/i,
            use: [
                "style-loader",
                {
                    loader: "css-loader",
                    options: {
                        importLoaders: 1
                    }
                },
                {
                    loader: "postcss-loader",
                    options: {
                        postcssOptions: {
                            plugins: [
                                tailwindcss({
                                    config: path.join(__dirname, "../tailwind.config.js")
                                })
                            ]
                        }
                    }
                },
                {
                    loader: "sass-loader",
                    options: { implementation: require.resolve("sass") }
                }
            ]
        });

        // Add SVG handling
        const svgRule = config.module?.rules?.find(rule => {
            const test = (rule as { test: RegExp }).test;
            return test ? test.test(".svg") : false;
        }) as { [key: string]: any };

        if (svgRule) {
            svgRule.exclude = /\.svg$/;
        }

        config.module?.rules?.push({
            test: /\.svg$/i,
            use: [
                {
                    loader: "@svgr/webpack",
                    options: {
                        svgoConfig: {
                            plugins: [
                                {
                                    name: "preset-default",
                                    params: {
                                        overrides: {
                                            removeViewBox: false
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    loader: "file-loader",
                    options: {
                        name: "[name].[hash].[ext]"
                    }
                }
            ]
        });

        return config;
    }
};

export default config;
