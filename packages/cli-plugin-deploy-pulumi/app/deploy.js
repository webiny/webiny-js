const { join, basename } = require("path");
const { green } = require("chalk");
const notifier = require("node-notifier");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const execa = require("execa");

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
            context.error(`Hook ${green(plugins[i].name)} encountered an error: ${err.message}`);
        }
    }
};

const SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

module.exports = async (inputs, context) => {
    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    const { env, folder, build } = inputs;
    const stackName = getStackName(folder);

    await loadEnvVariables(inputs, context);

    const stackDir = path.join(".", folder);

    if (build) {
        await execa(
            "webiny",
            [
                "workspaces",
                "run",
                "build",
                "--folder",
                stackDir,
                "--env",
                inputs.env,
                "--debug",
                Boolean(inputs.debug)
            ],
            {
                stdio: "inherit"
            }
        );
    }

    const pulumi = getPulumi({
        execa: {
            cwd: stackDir
        }
    });

    let stackExists = true;
    try {
        await pulumi.run(
            { command: ["stack", "select", env] },
            {
                args: {
                    secretsProvider: SECRETS_PROVIDER
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
                    secretsProvider: SECRETS_PROVIDER
                }
            }
        );
    }

    const isFirstDeploy = !stackExists;

    const hookDeployArgs = { isFirstDeploy, context, env, stack: stackName };

    if (inputs.preview) {
        context.info(`Skipped "hook-before-deploy" hook.`);
    } else {
        context.info(`Running "hook-before-deploy" hook...`);
        await processHooks("hook-before-deploy", hookDeployArgs);

        const continuing = inputs.preview ? `Previewing deployment...` : `Deploying...`;
        context.success(`Hook "hook-before-deploy" completed. ${continuing}`);
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
                secretsProvider: SECRETS_PROVIDER
            },
            execa: {
                stdio: "inherit"
            }
        });
    }

    const duration = getDuration();
    if (inputs.preview) {
        console.log();
        context.success(`Done! Preview finished in ${green(duration + "s")}.`);
    } else {
        console.log();
        context.success(`Done! Deploy finished in ${green(duration + "s")}.`);
        notify({ message: `"${folder}" stack deployed in ${duration}s.` });
    }

    if (inputs.preview) {
        context.info(`Skipped "hook-after-deploy" hook.`);
    } else {
        context.info(`Running "hook-after-deploy" hook...`);
        await processHooks("hook-after-deploy", hookDeployArgs);
        context.success(`Hook "hook-after-deploy" completed.`);
    }
};
