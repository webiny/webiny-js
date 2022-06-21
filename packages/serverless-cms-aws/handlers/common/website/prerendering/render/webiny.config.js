const webpack = config => {
    config.externals.push("chrome-aws-lambda");
    return config;
};

const createBuildFunction = require("../../../../createBuildFunction");
const createWatchFunction = require("../../../../createWatchFunction");

module.exports = {
    commands: {
        build: createBuildFunction({ cwd: __dirname, overrides: { webpack } }),
        watch: createWatchFunction({ cwd: __dirname, overrides: { webpack } })
    }
};
