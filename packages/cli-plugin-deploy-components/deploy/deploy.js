const { join, basename } = require("path");
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

const getStackName = folder => {
    folder = folder.split("/").pop();
    return folder === "." ? basename(process.cwd()) : folder;
};

const processHooks = async (hook, { context, ...options }) => {
    const plugins = context.plugins.byType(hook);

    for (let i = 0; i < plugins.length; i++) {
        try {
            await plugins[i].hook(options, context);
        } catch (err) {
            console.log(`🚨 Hook ${green(plugins[i].name)} encountered an error: ${err.message}`);
        }
    }
};
// eslint-disable-next-line
module.exports = async ({ options, ...inputs }, context) => {
    const { env, folder } = inputs;
    const stack = getStackName(folder);

    const isEnvDeployed = async ({ env }) => {
        const envFile = join(
            context.paths.projectRoot,
            ".webiny",
            "state",
            stack,
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

    const isFirstDeploy = !(await isEnvDeployed({ env }));
    if (isFirstDeploy) {
        inputs.watch = false;

        console.log(
            `This is the first deploy of ${green(env)} environment, so it may take a few minutes.`
        );
    }

    const beforeExecute = async () => {
        if (!inputs.watch) {
            const hooksParams = { isFirstDeploy, context, env, stack };

            await processHooks("hook-before-deploy", hooksParams);
            await processHooks("hook-stack-before-deploy", hooksParams);
        }
    };

    const afterExecute = async ({ output, duration }) => {
        console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.\n`);
        notify({ message: `"${stack}" stack deployed in ${duration}s.` });

        if (!inputs.watch) {
            const hooksParams = { isFirstDeploy, context, env, state: output, stack };

            await processHooks("hook-stack-after-deploy", hooksParams);
            await processHooks("hook-after-deploy", hooksParams);
        }
    };

    await execute(
        { ...inputs, stack, beforeExecute, afterExecute, isFirstDeploy },
        "default",
        context
    );

    // Restore the original `cwd`
    process.chdir(cwd);
};
