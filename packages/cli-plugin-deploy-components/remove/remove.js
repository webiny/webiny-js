const { join, basename } = require("path");
const fs = require("fs");
const { red, green } = require("chalk");
const { execute } = require("../execute");

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

module.exports = async (inputs, context) => {
    const { env, folder } = inputs;
    const stack = getStackName(folder);

    // Store current `cwd`
    const cwd = process.cwd();

    // Change CWD to the requested folder
    const newCwd = join(cwd, inputs.folder);
    if (!fs.existsSync(newCwd)) {
        console.log(`⚠️ ${red(context.replaceProjectRoot(newCwd))} does not exist!`);
        return;
    }

    process.chdir(newCwd);

    const hooksParams = { context, env, stack };

    await processHooks("hook-before-remove", hooksParams);
    await processHooks("hook-stack-before-remove", hooksParams);

    await execute({ ...inputs, stack }, "remove", context);
    console.log(`\n🎉 Done! Resources removed.`);

    await processHooks("hook-stack-after-remove", hooksParams);
    await processHooks("hook-after-remove", hooksParams);

    // Restore the original `cwd`
    process.chdir(cwd);
};
