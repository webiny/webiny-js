const { join, resolve } = require("path");
const fs = require("fs");
const { green, red } = require("chalk");
const notifier = require("node-notifier");
const loadJson = require("load-json-file");
const { execute } = require("../execute");

const notify = ({ message }) => {
    notifier.notify({
        title: "Webiny CLI",
        message,
        icon: join(__dirname, "logo.png"),
        sound: false,
        wait: true
    });
};

module.exports = async (inputs, context) => {
    const { env, folder } = inputs;

    const isEnvDeployed = async ({ folder, env }) => {
        const envFile = join(
            context.paths.projectRoot,
            ".webiny",
            "state",
            folder,
            env,
            `Webiny.json`
        );
        try {
            const json = await loadJson(envFile);
            return json.components && json.outputs;
        } catch (err) {
            return false;
        }
    };

    // Store current `cwd`
    const cwd = process.cwd();

    // Change CWD to the requested folder
    const newCwd = join(cwd, folder);
    if (!fs.existsSync(newCwd)) {
        console.log(`⚠️ ${red(context.replaceProjectRoot(newCwd))} does not exist!`);
        return;
    }

    process.chdir(newCwd);

    const isFirstDeploy = !(await isEnvDeployed({ folder, env }));
    if (isFirstDeploy) {
        inputs.watch = false;
        console.log(
            `This is the first deploy of ${green(env)} environment, so it may take a few minutes.`
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
                const hookPath = context.replaceProjectRoot(appLocation);
                if (hooks && hooks.stateChanged) {
                    console.log(
                        `🎣 Processing ${green("stateChanged")} hook in ${green(
                            context.replaceProjectRoot(hookPath)
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

    await execute({ ...inputs, callback: afterDeploy }, "default", context);

    // Restore the original `cwd`
    process.chdir(cwd);
};
