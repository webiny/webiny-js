const { basename } = require("path");
const { red, green } = require("chalk");
const path = require("path");
const { Pulumi } = require("@webiny/pulumi-sdk");

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
    const { env, folder, debug = true } = inputs;
    const stacksDir = path.join(".", folder);

    const projectRoot = context.paths.projectRoot;

    // Load .env.json from project root
    await context.loadEnv(path.resolve(projectRoot, ".env.json"), env, { debug });

    // Load .env.json from cwd (this will change depending on the folder you specified)
    await context.loadEnv(path.resolve(projectRoot, folder, ".env.json"), env, { debug });

    const pulumi = new Pulumi({
        defaults: {
            options: { cwd: stacksDir, env: { PULUMI_CONFIG_PASSPHRASE: "123123" } }
        }
    });

    const stack = getStackName(folder);

    let stackExists = true;
    try {
        await pulumi.run(["stack", "select", env]);
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        console.log(`⚠️ ${red(stack)} does not exist!`);
        return;
    }

    const hooksParams = { context, env, stack };

    await processHooks("hook-before-remove", hooksParams);
    await processHooks("hook-stack-before-remove", hooksParams);

    const destroySubProcess = pulumi.run("destroy", {
        yes: true
    });

    await destroySubProcess.toConsole();

    console.log(`\n🎉 Done! Resources removed.`);

    await processHooks("hook-stack-after-remove", hooksParams);
    await processHooks("hook-after-remove", hooksParams);
};
