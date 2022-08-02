const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");
const glob = require("fast-glob");

module.exports = {
    commands: {
        build: createBuildPackage({ cwd: __dirname }),
        watch: createWatchPackage({ cwd: __dirname }),
        buildHandlers: async options => {
            // Bundle all handlers. These are then used directly in real Webiny projects.
            const wbyConfigsPaths = glob.sync(`${__dirname}/handlers/**/webiny.config.js`);

            // Bundle handlers.
            for (let i = 0; i < wbyConfigsPaths.length; i++) {
                const wbyConfigPath = wbyConfigsPaths[i];
                await require(wbyConfigPath).commands.build(options);
            }
        }
    }
};
