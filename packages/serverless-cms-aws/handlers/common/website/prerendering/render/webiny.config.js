const createBuildFunction = require("../../../../createBuildFunction");
const createWatchFunction = require("../../../../createWatchFunction");

const rspack = config => {
    return config;
};

module.exports = {
    commands: {
        build: createBuildFunction({ cwd: __dirname, overrides: { rspack } }),
        watch: createWatchFunction({ cwd: __dirname, overrides: { rspack } })
    }
};
