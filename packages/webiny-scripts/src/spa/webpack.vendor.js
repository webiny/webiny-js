import path from "path";
import webpack from "webpack";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";

import ModuleIdsPlugin from "./plugins/ModuleIds";
import babelOptions from "./babel";

import { getIfUtils, removeEmpty } from "webpack-config-utils";
const { ifProduction, ifDevelopment } = getIfUtils(process.env.NODE_ENV);

export default ({ projectRoot, appRoot }) => {
    const outputPath = path.resolve(path.join(projectRoot, "dist", process.env.NODE_ENV));

    const plugins = removeEmpty([
        ifProduction(new ModuleIdsPlugin()),
        ifDevelopment(new webpack.HotModuleReplacementPlugin()),
        ifDevelopment(new webpack.NamedModulesPlugin()),
        new webpack.DefinePlugin({
            DEVELOPMENT: process.env.NODE_ENV === "development",
            PRODUCTION: process.env.NODE_ENV === "production",
            "process.env": {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        }),
        new webpack.DllPlugin({
            path: outputPath + "/vendor.manifest.json",
            name: "Webiny_Vendor_DLL"
        }),
        ifProduction(new UglifyJsPlugin())
    ]);

    return {
        context: appRoot,
        entry: {},
        output: {
            path: outputPath,
            filename: ifProduction("vendor-[chunkhash].dll.js", "vendor.dll.js"),
            library: "Webiny_Vendor_DLL"
        },
        plugins,
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: babelOptions
                        }
                    ]
                }
            ]
        },
        resolve: {
            alias: {
                jquery: require.resolve("jquery/dist/jquery.slim.js")
            },
            extensions: [".jsx", ".js"]
        },
        resolveLoader: {
            modules: [__dirname + "/loaders", "node_modules"]
        }
    };
};
