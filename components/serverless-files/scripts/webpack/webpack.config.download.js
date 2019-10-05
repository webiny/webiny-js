const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/functions/download/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "build/download"),
        filename: "handler.js"
    }
});
