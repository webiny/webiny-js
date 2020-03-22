const buildApi = require("./webpack/buildApi");
const createApiWebpackConfig = require("./webpack/createApiWebpackConfig");
const createAppWebpackConfig = require("./webpack/createAppWebpackConfig");

module.exports = {
    buildApi,
    createApiWebpackConfig,
    createAppWebpackConfig
};
