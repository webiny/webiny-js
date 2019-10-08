const path = require("path");
const createWebpackConfig = require("./createWebpackConfig");

module.exports = createWebpackConfig({
    entry: process.cwd() + "/functions/manageS3Objects/handler.js",
    output: {
        libraryTarget: "commonjs",
        path: path.join(process.cwd(), "dist/manageS3Objects"),
        filename: "handler.js"
    }
});
