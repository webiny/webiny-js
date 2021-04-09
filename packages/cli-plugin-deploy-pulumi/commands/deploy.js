const { join, basename } = require("path");
const { green } = require("chalk");
const notifier = require("node-notifier");
const path = require("path");
const loadEnvVariables = require("../utils/loadEnvVariables");
const getPulumi = require("../utils/getPulumi");
const login = require("../utils/login");
const execa = require("execa");

const notify = ({ message }) => {
    return new Promise(resolve => {
        notifier.notify({
            title: "Webiny CLI",
            message,
            icon: join(__dirname, "logo.png"),
            sound: false
        });

        setTimeout(resolve, 100);
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
    const { env, folder, build } = inputs;

    // If folder not specified, that means we want to deploy the whole project (all project applications).
    // For that, we look if there are registered plugins that perform that.
    if (!folder) {
        const plugin = context.plugins.byName("cli-command-deployment-deploy-all");
        if (!plugin) {
            throw new Error(
                `Cannot continue - "cli-command-deployment-deploy-all" plugin not found.`
            );
        }

        return plugin.deploy(inputs, context);
    }

    if (!env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const start = new Date();
    const getDuration = () => {
        return (new Date() - start) / 1000;
    };

    const stackName = getStackName(folder);

    await loadEnvVariables(inputs, context);

    const stackDir = path.join(".", folder);

    if (build) {
        await execa(
            "yarn",
            [
                "webiny",
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

    await login(stackDir);

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

    const hookDeployArgs = { isFirstDeploy, context, inputs, env, stack: stackName };

    if (inputs.preview) {
        context.info(`Skipped "hook-before-deploy" hook.`);
    } else {
        context.info(`Running "hook-before-deploy" hook...`);
        await processHooks("hook-before-deploy", hookDeployArgs);

        const continuing = inputs.preview ? `Previewing deployment...` : `Deploying...`;
        context.success(`Hook "hook-before-deploy" completed. ${continuing}`);
    }

    console.log();

    if (inputs.preview) {
        await pulumi.run({
            command: "preview",
            execa: {
                stdio: "inherit",
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.projectName
                }
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
                // stdio: ["inherit", "inherit", process.stderr],
                stdio: ["inherit", "inherit", "pipe"],
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.projectName
                }
            }
        });
    }

    const duration = getDuration();
    if (inputs.preview) {
        context.success(`Done! Preview finished in ${green(duration + "s")}.`);
    } else {
        context.success(`Done! Deploy finished in ${green(duration + "s")}.`);
    }

    console.log();
    if (inputs.preview) {
        context.info(`Skipped "hook-after-deploy" hook.`);
    } else {
        context.info(`Running "hook-after-deploy" hook...`);
        await processHooks("hook-after-deploy", hookDeployArgs);
        context.success(`Hook "hook-after-deploy" completed.`);
    }

    notify({ message: `"${folder}" stack deployed in ${duration}s.` });
};
