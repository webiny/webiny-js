const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: createBuildPackage({ cwd: __dirname }),
        watch: createWatchPackage({ cwd: __dirname })
    }
};
