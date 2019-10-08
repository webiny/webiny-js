const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

const PATHS = {
    build: {
        entry: path.join(process.cwd(), "functions/images/imageTransformer/handler.js"),
        output: path.join(process.cwd(), "dist/functions/imageTransformer")
    },
    nodeModules: {
        from: path.join(__dirname, "imageProcessor/node_modules.zip"),
        to: path.join(process.cwd(), "dist/functions/imageTransformer")
    }
};

module.exports = createWebpackConfig({
    entry: PATHS.build.entry,
    output: {
        libraryTarget: "commonjs",
        path: PATHS.build.output,
        filename: "handler.js"
    },
    externals: ["aws-sdk", "sharp"],
    plugins: [
        {
            apply: compiler => {
                compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
                    const extract = require("extract-zip");
                    extract(PATHS.nodeModules.from, { dir: PATHS.nodeModules.to }, e => {
                        if (e) {
                            throw e;
                        }
                    });
                });
            }
        }
    ]
});
