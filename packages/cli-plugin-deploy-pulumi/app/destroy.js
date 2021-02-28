const { basename } = require("path");
const { red, green } = require("chalk");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");

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
            context.error(`Hook ${green(plugins[i].name)} encountered an error: ${err.message}`);
        }
    }
};

module.exports = async (inputs, context) => {
    const { env, folder } = inputs;
    const stacksDir = path.join(".", folder);

    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    await loadEnvVariables(inputs, context);

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    await login(folder);

    const stackName = getStackName(folder);

    let stackExists = true;
    try {
        await pulumi.run({ command: ["stack", "select", env] });
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        context.error(
            `Project application ${red(folder)} (${red(env)} environment) does not exist.`
        );
        return;
    }

    const hooksParams = { context, env, stack: stackName };

    await processHooks("hook-before-destroy", hooksParams);

    await pulumi.run({
        command: "destroy",
        execa: {
            stdio: "inherit",
            env: {
                WEBINY_ENV: env
            }
        },
        args: {
            yes: true
        }
    });

    console.log();

    const duration = getDuration();
    context.success(`Done! Destroy finished in ${green(duration + "s")}.`);

    await processHooks("hook-after-destroy", hooksParams);
};
