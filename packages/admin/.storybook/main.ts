import type { StorybookConfig } from "@storybook/react-webpack5";
import { join, dirname } from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

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
                                        plugins: [require("tailwindcss")]
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
    core: { disableTelemetry: true },
    webpackFinal: async config => {
        if (!config.resolve) {
            config.resolve = {};
        }

        config.resolve.plugins = [new TsconfigPathsPlugin()];
        return config;
    }
};

export default config;
