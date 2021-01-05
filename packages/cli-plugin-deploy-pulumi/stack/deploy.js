const { join, basename } = require("path");
const { green } = require("chalk");
const notifier = require("node-notifier");
const path = require("path");
const loadEnvFiles = require("../utils/loadEnvFiles");
const getPulumi = require("../utils/getPulumi");

const notify = ({ message }) => {
    notifier.notify({
        title: "Webiny CLI",
        message,
        icon: join(__dirname, "logo.png"),
        sound: false,
        wait: true
    });
};

const getStackName = stack => {
    stack = stack.split("/").pop();
    return stack === "." ? basename(process.cwd()) : stack;
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
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    const { env, stack, build } = inputs;
    const stackName = getStackName(stack);

    await loadEnvFiles(inputs, context);

    const stacksDir = path.join(".", stack);

    if (build) {
        const buildPlugin = context.plugins.byName("cli-command-build");
        await buildPlugin.execute({ path: stacksDir, env }, context);
    }

    const pulumi = getPulumi({
        execa: {
            cwd: stacksDir
        }
    });

    let stackExists = true;
    try {
        await pulumi.run(
            { command: ["stack", "select", env] },
            {
                args: {
                    secretsProvider: "passphrase"
                }
            }
        );
    } catch (e) {
        stackExists = false;
    }

    if (!stackExists) {
        await pulumi.run(
            { command: ["stack", "init", env] },
            {
                args: {
                    secretsProvider: "passphrase"
                }
            }
        );
    }

    const isFirstDeploy = !stackExists;

    const hookDeployArgs = { isFirstDeploy, context, env, stack: stackName };

    if (inputs.preview) {
        console.log(`Skipped "hook-before-deploy" hook.`);
    } else {
        console.log(`💡 Running "hook-before-deploy" hook...`);
        await processHooks("hook-before-deploy", hookDeployArgs);

        const continuing = inputs.preview ? `Previewing stack...` : `Deploying stack...`;
        console.log(`${green("✔")} Hook "hook-before-deploy" completed. ${continuing}\n`);
    }

    if (inputs.preview) {
        await pulumi.run({
            command: "preview",
            execa: {
                stdio: "inherit"
            }
        });
    } else {
        await pulumi.run({
            command: "up",
            args: {
                yes: true,
                skipPreview: true,
                secretsProvider: "passphrase"
            },
            execa: {
                stdio: "inherit"
            }
        });
    }

    const duration = getDuration();
    if (inputs.preview) {
        console.log(`\n🎉 Done! Preview finished in ${green(duration + "s")}.\n`);
    } else {
        console.log(`\n🎉 Done! Deploy finished in ${green(duration + "s")}.\n`);
        notify({ message: `"${stack}" stack deployed in ${duration}s.` });
    }

    if (inputs.preview) {
        console.log(`Skipped "hook-after-deploy" hook.`);
    } else {
        console.log(`💡 Running "hook-after-deploy" hook...`);
        await processHooks("hook-after-deploy", hookDeployArgs);
        console.log(`${green("✔")} Hook "hook-after-deploy" completed.\n`);
    }
};
