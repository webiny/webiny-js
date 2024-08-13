import type { StorybookConfig } from "@storybook/react-webpack5";
import { join, dirname } from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import tailwindcss from "tailwindcss";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
        getAbsolutePath("@storybook/addon-a11y"),
        getAbsolutePath("@storybook/addon-webpack5-compiler-swc"),
        {
            name: "@storybook/addon-essentials",
            options: {
                controls: false
            }
        },
        {
            name: "@storybook/addon-styling-webpack",
            options: {
                rules: [
                    // Replaces any existing Sass rules with given rules
                    {
                        test: /\.s[ac]ss$/i,
                        use: [
                            "style-loader",
                            {
                                loader: require.resolve("css-loader"),
                                options: {
                                    importLoaders: 1
                                }
                            },
                            {
                                loader: require.resolve("postcss-loader"),
                                options: {
                                    implementation: require.resolve("postcss"),
                                    postcssOptions: {
                                        plugins: [
                                            tailwindcss({
                                                config: join(__dirname, "../tailwind.config.js")
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
                    }
                ]
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
        if (!config.resolve) {
            config.resolve = {};
        }

        config.resolve.plugins = [new TsconfigPathsPlugin()];

        // Find the rule that handles SVGs (this depends on the default Storybook config)
        const svgRule = config.module?.rules?.find(rule => {
            const test = (rule as { test: RegExp }).test;

            if (!test) {
                return false;
            }

            return test.test(".svg");
        }) as { [key: string]: any };

        svgRule.exclude = /\.svg$/;

        config.module?.rules?.push({
            test: /\.svg$/i,
            use: [
                {
                    loader: "@svgr/webpack"
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
