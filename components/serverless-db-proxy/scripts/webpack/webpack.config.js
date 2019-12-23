const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "dist/"),
        filename: "handler.js"
    }
});
