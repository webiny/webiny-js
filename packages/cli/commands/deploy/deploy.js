const { join, resolve } = require("path");
const fs = require("fs");
const { green, red } = require("chalk");
const notifier = require("node-notifier");
const { execute } = require("../utils/execute");
const { isEnvDeployed } = require("../utils");
const { paths } = require("../utils/paths");

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
    const { env, folder } = inputs;

    // Store current `cwd`
    const cwd = process.cwd();

    // Change CWD to the requested folder
    const newCwd = join(cwd, folder);
    if (!fs.existsSync(newCwd)) {
        console.log(`⚠️ ${red(paths.replaceProjectRoot(newCwd))} does not exist!`);
        return;
    }

    process.chdir(newCwd);

    const isFirstDeploy = !(await isEnvDeployed({ folder, env }));
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
        const configFile = resolve("webiny.config.js");

        // Run app state hooks
        if (!fs.existsSync(configFile)) {
            console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.`);
            return;
        }

        const config = require(configFile);

        for (let i = 0; i < config.hooks.length; i++) {
            const appLocation = resolve(config.hooks[i]);
            try {
                const { hooks } = require(join(appLocation, "webiny.config.js"));
                const hookPath = paths.replaceProjectRoot(appLocation);
                if (hooks && hooks.stateChanged) {
                    console.log(
                        `🎣 Processing ${green("stateChanged")} hook in ${green(
                            paths.replaceProjectRoot(hookPath)
                        )}`
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

    await execute({ ...inputs, callback: afterDeploy });

    // Restore the original `cwd`
    process.chdir(cwd);
};
