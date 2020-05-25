const { join } = require("path");
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

module.exports = async ({ options, ...inputs }, context) => {
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
        console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.\n`);
        notify({ message: `"${folder}" stack deployed in ${duration}s.` });

        if (options.hooks) {
            // Get hooks for current stack
            const hooks = options.hooks[folder] || [];

            for (let i = 0; i < hooks.length; i++) {
                const hook = hooks[i];
                if (typeof hook === "string") {
                    try {
                        const hookPath = hook.startsWith(".") ? context.resolve(hook) : hook;
                        const handler = require(hookPath);
                        if (handler.hooks && typeof handler.hooks.afterDeploy === "function") {
                            await handler.hooks.afterDeploy({
                                stack: folder,
                                isFirstDeploy,
                                env,
                                state: output
                            });
                        }
                    } catch (err) {
                        console.log(`⚠️ Hook ${green(hook)} encountered an error: ${err.message}`);
                    }
                }
            }
        }
    };

    await execute({ ...inputs, callback: afterDeploy }, "default", context);

    // Restore the original `cwd`
    process.chdir(cwd);
};
