import { Plugin } from "@webiny/core";
import webpack from "webpack";
import path from "path";
// @ts-ignore
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import HtmlWebpackPlugin from "html-webpack-plugin";

interface Params {
    entry: string;
    html: string;
    plugins: Plugin[];
    output: string;
    watch: boolean;
}

interface CallbackFunction<T> {
    (err?: null | Error, result?: T): any;
}

export async function bundle({ entry, watch, output, plugins, html }: Params) {
    const defaultConfig: webpack.Configuration = {
        entry,
        mode: "development",
        devtool: "inline-source-map",
        output: {
            path: output,
            filename: "bundle.js",
            clean: true
        },
        optimization: {
            minimize: false,
            usedExports: true,
            concatenateModules: false // Necessary for bundle analyzer
        },
        target: "web",
        module: {
            rules: [
                {
                    test: /\.(js|mjs|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            sourceType: "unambiguous",
                            presets: [
                                [require.resolve("@babel/preset-env")],
                                require.resolve("@babel/preset-react"),
                                require.resolve("@babel/preset-typescript")
                            ],
                            plugins: [
                                [
                                    "@babel/plugin-transform-runtime",
                                    {
                                        corejs: false,
                                        version: require("@babel/runtime/package.json").version,
                                        regenerator: true
                                    }
                                ]
                            ],
                            sourceMaps: true
                        }
                    }
                }
            ]
        },
        resolve: {
            alias: {
                plugins: path.resolve(process.cwd(), "plugins"),
                webiny: path.resolve(process.cwd(), "webiny")
            },
            extensions: [".mjs", ".ts", ".tsx", ".json", ".jsx", ".js"],
            fallback: {
                path: require.resolve("path-browserify")
            }
        },
        stats: {
            errorDetails: true
        },
        plugins: [
            // new BundleAnalyzerPlugin(),
            new webpack.DefinePlugin(
                plugins.reduce<Record<string, string>>((acc, plugin) => {
                    if (plugin.admin!.define) {
                        return { ...acc, ...plugin.admin!.define };
                    }
                    return acc;
                }, {})
            ),
            new HtmlWebpackPlugin({
                template: html
            })
        ]
    };

    let config = defaultConfig;
    plugins.forEach(pl => {
        if (typeof pl.admin!.webpack === "function") {
            config = pl.admin!.webpack(config);
        }
    });

    return new Promise<void>((resolve, reject) => {
        const callback: CallbackFunction<webpack.Stats> = (err, stats) => {
            try {
                handleStats(err, stats);
            } catch (err) {
                reject(err);
            }

            if (watch) {
                console.log("App rebuilt.\n");
            }

            resolve();
        };

        if (watch) {
            webpack(config).watch({}, callback);
        } else {
            webpack(config).run(callback);
        }
    });
}

function handleStats(err: Error | null | undefined, stats?: webpack.Stats) {
    if (stats) {
        console.log(
            stats.toString({
                colors: true,
                assets: true,
                modules: false,
                warnings: false,
                errorDetails: true
            })
        );
    }

    if (err || (stats && stats.hasErrors())) {
        throw err;
    }
}
