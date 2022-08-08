const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");
const glob = require("fast-glob");

async function buildHandlers(options) {
    // Bundle all handlers. These are then used directly in real Webiny projects.
    const wbyConfigsPaths = glob.sync(`${__dirname}/handlers/**/webiny.config.js`);

    // Bundle handlers.
    for (let i = 0; i < wbyConfigsPaths.length; i++) {
        const wbyConfigPath = wbyConfigsPaths[i];
        await require(wbyConfigPath).commands.build(options);
    }
}

module.exports = {
    commands: {
        build: async options => {
            await createBuildPackage({ cwd: __dirname })(options);
            await buildHandlers(options);
        },
        watch: createWatchPackage({ cwd: __dirname }),
        buildHandlers
    }
};
