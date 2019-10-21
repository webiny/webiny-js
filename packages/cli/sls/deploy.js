const { join } = require("path");
const { green } = require("chalk");
const execute = require("./execute");

module.exports = async inputs => {
    const { what, env } = inputs;
    const output = await execute(inputs);

    if (what === "api") {
        // Run app state hooks
        const config = require(join(process.cwd(), "webiny"));
        for (let i = 0; i < config.apps.length; i++) {
            const app = config.apps[i];
            const appLocation = join(process.cwd(), app.location);
            try {
                const { hooks } = require(join(appLocation, "webiny"));
                if (hooks && hooks.stateChanged) {
                    console.log(
                        `🎣 Processing ${green("stateChanged")} hook in ${green(app.name)} app`
                    );

                    await hooks.stateChanged({ env, state: output });
                }
            } catch (err) {
                // if webiny.js file is not found in the app, ignore it.
            }
        }

        console.log(`\n🎉 Done!`);
        if (output.cdn) {
            console.log(`🚀 GraphQL API URL: ${green(output.cdn.url + "/graphql")}`);
        }
    }
};
