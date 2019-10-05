const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");
const fs = require("fs-extra");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/functions/fileProcessors/images/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "build/fileProcessors/images"),
        filename: "handler.js"
    },
    externals: ['aws-sdk', 'sharp'],
    plugins: [
        {
            apply: compiler => {
                compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
                    // We copy the sharp
                    /*exec('<path to your post-build script here>', (err, stdout, stderr) => {
                        if (stdout) process.stdout.write(stdout);
                        if (stderr) process.stderr.write(stderr);
                    });*/
                });
            }
        }
    ]
});
