const { join } = require("path");
const { green } = require("chalk");
const execute = require("./execute");
const { isApiEnvDeployed } = require("./utils");

const perks = ["a 🍪", "☕️", "an 🍎", "a 🍺"];

module.exports = async inputs => {
    const { what, env } = inputs;

    if (what === "apps") {
        if (env === "local") {
            console.log(
                `🚨 You can't deploy "local" apps environment as it is reserved for local development.`
            );
            process.exit(1);
        }
        return await execute(inputs);
    }

    if (what === "api") {
        const isFirstDeploy = !(await isApiEnvDeployed(env));
        if (isFirstDeploy) {
            const perk = perks[Math.floor(Math.random() * perks.length)];
            console.log(
                `This is the first deploy of ${green(
                    env
                )} environment, so it may take a few minutes.\nHere's ${perk} to make the time pass faster :)`
            );
        }

        const output = await execute(inputs);

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
            if (isFirstDeploy) {
                console.log(
                    `⏳ Please note that CDN distribution takes some time to propagate, so expect this URL to become accessible in ~10 minutes.`
                );
            }
        }
    }
};
