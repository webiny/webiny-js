const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: createBuildPackage({
            cwd: __dirname,
            exclude: ["**/testUtils/**", "**/__tests__/**"]
        }),
        watch: createWatchPackage({ cwd: __dirname })
    }
};
