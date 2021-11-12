const util = require("util");
const path = require("path");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

module.exports = {
    commands: {
        build: async (options, context) => {
            await createBuildPackage({ cwd: __dirname })(options, context);
            const from = path.join(__dirname, "template");
            const to = path.join(__dirname, "dist/template");
            await ncp(from, to);
        },
        watch: createWatchPackage({ cwd: __dirname })
    }
};
