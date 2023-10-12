const createBuildFunction = require("../../../../createBuildFunction");
const createWatchFunction = require("../../../../createWatchFunction");

const webpack = config => {
    config.externals.push("chrome-aws-lambda");
    return config;
};

module.exports = {
    commands: {
        build: createBuildFunction({ cwd: __dirname, overrides: { webpack } }),
        watch: createWatchFunction({ cwd: __dirname, overrides: { webpack } })
    }
};
