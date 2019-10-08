const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/functions/downloadFile/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "dist/functions/downloadFile"),
        filename: "handler.js"
    }
});
