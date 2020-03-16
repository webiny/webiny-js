const { join, resolve } = require("path");
const fs = require("fs");
const { green, red } = require("chalk");
const notifier = require("node-notifier");
const { execute } = require("../utils/execute");
const { isApiEnvDeployed } = require("../utils");

const perks = ["🍪", "☕️", "🍎", "🍺", "🥤"];

const notify = ({ message }) => {
    notifier.notify({
        title: "Webiny CLI",
        message,
        icon: join(__dirname, "logo.png"),
        sound: false,
        wait: true
    });
};

module.exports = async inputs => {
    const { env } = inputs;
    const webinyJs = resolve("webiny.js");
    const config = require(webinyJs);

    const isFirstDeploy = !(await isApiEnvDeployed(env));
    if (isFirstDeploy) {
        inputs.watch = false;
        const perk = perks[Math.floor(Math.random() * perks.length)];
        console.log(
            `This is the first deploy of ${green(
                env
            )} environment, so it may take a few minutes.\nHere's ${perk} to make the time pass faster :)`
        );
    }

    const afterDeploy = async ({ output, duration }) => {
        // Run app state hooks
        if (!fs.existsSync(webinyJs)) {
            console.log(
                `⚠️ ${green("webiny.config.js")} was not found at ${green(
                    webinyJs
                )}, skipping processing of hooks.`
            );
            console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.`);
            return;
        }

        for (let i = 0; i < config.apps.length; i++) {
            const app = config.apps[i];
            const appLocation = resolve(app.location);
            try {
                const { hooks } = require(join(appLocation, "webiny"));
                if (hooks && hooks.stateChanged) {
                    console.log(
                        `🎣 Processing ${green("stateChanged")} hook in ${green(app.name)} app`
                    );

                    await hooks.stateChanged({ env, state: output });
                }
            } catch (err) {
                console.log(
                    `⚠️ ${red(err.message)}, while processing hooks at ${green(appLocation)}.`
                );
            }
        }

        console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.`);
        notify({ message: `API deploy completed in ${duration}s.` });

        if (output.cdn) {
            console.log(`🚀 GraphQL API URL: ${green(output.cdn.url + "/graphql")}`);
            if (isFirstDeploy) {
                console.log(
                    `⏳ Please note that CDN distribution takes some time to propagate, so expect this URL to become accessible in ~10 minutes.`
                );
            }
        }
    };

    return execute({ ...inputs, what: "api", callback: afterDeploy });
};
