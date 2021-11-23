const { createWatchFunction, createBuildFunction } = require("@webiny/project-utils");

module.exports = {
    commands: {
        watch: createWatchFunction({ cwd: __dirname }),
        build: createBuildFunction({ cwd: __dirname })
    }
};
