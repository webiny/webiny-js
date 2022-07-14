const createBuildFunction = require("../../../../createBuildFunction");
const createWatchFunction = require("../../../../createWatchFunction");

module.exports = {
    commands: {
        build: createBuildFunction({ cwd: __dirname }),
        watch: createWatchFunction({ cwd: __dirname })
    }
};
