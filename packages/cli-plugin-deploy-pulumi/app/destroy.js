const { basename } = require("path");
const { red, green } = require("chalk");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");

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

    await loadEnvVariables(inputs, context);

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    const stackName = getStackName(folder);

    let stackExists = true;
    try {
        await pulumi.run({ command: ["stack", "select", env] });
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        context.error(`${red(stackName)} does not exist!`);
        return;
    }

    const hooksParams = { context, env, stack: stackName };

    await processHooks("hook-before-destroy", hooksParams);
    await processHooks("hook-stack-before-destroy", hooksParams);

    await pulumi.run({
        command: "destroy",
        execa: { stdio: "inherit" },
        args: {
            yes: true
        }
    });

    console.log();
    context.success(`Done! Stack destroyed.`);

    await processHooks("hook-stack-after-destroy", hooksParams);
    await processHooks("hook-after-destroy", hooksParams);
};
