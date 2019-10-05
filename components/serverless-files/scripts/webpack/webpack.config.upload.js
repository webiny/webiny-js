const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/functions/upload/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "build/upload"),
        filename: "handler.js"
    }
});
