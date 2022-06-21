const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");
const glob = require("fast-glob");

module.exports = {
    commands: {
        build: async options => {
            // First we build the package, as usual.
            await createBuildPackage({ cwd: __dirname })(options);

            // Then we bundle all of the handlers. These are then used directly in real Webiny projects.
            const wbyConfigsPaths = glob.sync(`${__dirname}/handlers/**/webiny.config.js`);

            // Bundle handlers.
            for (let i = 0; i < wbyConfigsPaths.length; i++) {
                const wbyConfigPath = wbyConfigsPaths[i];
                await require(wbyConfigPath).commands.build(options);
            }
        },
        watch: createWatchPackage({ cwd: __dirname })
    }
};
