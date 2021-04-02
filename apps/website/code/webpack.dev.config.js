const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

const sassIncludePaths = [path.resolve("./src"), path.resolve("./node_modules")];

module.exports = {
    mode: "development",
    output: {
        publicPath: "/"
    },
    entry: "./src/index.tsx",
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    require.resolve("style-loader"),
                    {
                        loader: require.resolve("css-loader"),
                        options: { importLoaders: 1 }
                    },
                    {
                        loader: require.resolve("postcss-loader"),
                        options: {
                            implementation: require("postcss"),
                            postcssOptions: {
                                plugins: [
                                    require("postcss-preset-env")(),
                                    require("postcss-normalize")()
                                ]
                            }
                        }
                    },
                    {
                        loader: require.resolve("sass-loader"),
                        options: {
                            sourceMap: true,
                            sassOptions: { includePaths: sassIncludePaths }
                        }
                    }
                ],
                sideEffects: true
            },
            {
                test: /\.svg$/i,
                use: [require.resolve("@svgr/webpack"), require.resolve("url-loader")]
            },
            {
                test: /\.(ts|js)x?$/i,
                exclude: /node_modules/,
                use: {
                    loader: require.resolve("babel-loader"),
                    options: {
                        presets: [
                            require.resolve("@babel/preset-env"),
                            require.resolve("@babel/preset-react"),
                            require.resolve("@babel/preset-typescript")
                        ],
                        plugins: [require.resolve("react-refresh/babel")]
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: [".mjs", ".tsx", ".ts", ".js"]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ReactRefreshWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: "public/index.html"
        }),
        new ForkTsCheckerWebpackPlugin({
            async: false
        }),
        new ESLintPlugin({
            extensions: ["js", "jsx", "ts", "tsx"]
        })
    ],
    devtool: "inline-source-map",
    devServer: {
        historyApiFallback: true,
        port: 4000,
        open: false,
        hot: true
    }
};
