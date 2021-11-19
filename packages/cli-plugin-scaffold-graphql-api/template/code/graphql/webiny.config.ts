const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        watch: createWatchPackage({ cwd: __dirname }),
        build: createBuildPackage({ cwd: __dirname })
    }
};
