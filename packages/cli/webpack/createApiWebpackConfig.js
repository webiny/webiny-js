module.exports = ({ watch }) => {
    const executor = require("./api/executor")({ watch });
    const webpackConfig = require("./api/webpack.config");

    return { execute: executor, webpackConfig: webpackConfig() };
};
