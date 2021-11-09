const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");
const path = require("path");
const util = require("util");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

module.exports = {
    commands: {
        build: async (...args) => {
            await createBuildPackage({ cwd: __dirname })(...args);
            const from = path.join(__dirname, "src", "installation", "files");
            const to = path.join(__dirname, "dist", "installation", "files");
            await ncp(from, to);
        },
        watch: createWatchPackage({ cwd: __dirname })
    }
};
