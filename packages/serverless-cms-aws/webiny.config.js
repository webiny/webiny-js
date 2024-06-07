const glob = require("fast-glob");
const path = require("path");
const { Listr } = require("listr2");
const { createWatchPackage, createBuildPackage } = require("@webiny/project-utils");

async function buildHandlers(options) {
    if (process.env.WEBINY_SERVERLESS_CMS_AWS_SKIP_PREPUBLISH_ONLY === "true") {
        console.log("Skipping building of handlers...");
        return;
    }

    // Bundle all handlers. These are then used directly in real Webiny projects.
    const handlerPaths = glob.sync(`${__dirname}/handlers/**/webiny.config.js`);

    const runner = new Listr(
        [
            {
                title: "Build handlers for user projects",
                task(ctx, task) {
                    return task.newListr(
                        handlerPaths.map(handlerPath => {
                            return {
                                title: path.dirname(handlerPath).replace(__dirname, "."),
                                async task() {
                                    await require(handlerPath).commands.build({
                                        ...options,
                                        logs: false
                                    });
                                }
                            };
                        })
                    );
                }
            }
        ],
        { concurrent: false, rendererOptions: { showTimer: true, collapse: false } }
    );
    await runner.run();
}

module.exports = {
    commands: {
        build: createBuildPackage({ cwd: __dirname }),
        watch: createWatchPackage({ cwd: __dirname }),
        buildHandlers
    }
};
