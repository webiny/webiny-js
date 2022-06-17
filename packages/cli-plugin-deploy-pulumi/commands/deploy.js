const path = require("path");
const { green } = require("chalk");
const { getProjectApplication } = require("@webiny/cli/utils");
const buildPackages = require("./deploy/buildPackages");
const {
    getPulumi,
    processHooks,
    login,
    notify,
    createProjectApplicationWorkspace
} = require("../utils");

module.exports = async (inputs, context) => {
    const { env, folder, build, deploy } = inputs;

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
        return (new Date() - start) / 1000 + "s";
    };

    // Get project application metadata. Will throw an error if invalid folder specified.
    const projectApplication = getProjectApplication({ cwd: path.join(process.cwd(), folder) });

    // If needed, let's create a project application workspace.
    if (projectApplication.type === "v5-workspaces") {
        await createProjectApplicationWorkspace(projectApplication, { env });
    }

    const hookArgs = { context, env, inputs, projectApplication };

    if (build) {
        await runHook({
            hook: "hook-before-build",
            args: hookArgs,
            context
        });

        await buildPackages({ projectApplication, inputs, context });

        await runHook({
            hook: "hook-after-build",
            args: hookArgs,
            context
        });
    } else {
        context.info("Skipping building of packages.");
    }

    console.log();

    if (!deploy) {
        context.info("Skipping project application deployment.");
        return;
    }

    await login(projectApplication);

    const pulumi = await getPulumi({ projectApplication });

    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
    const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

    await pulumi.run({
        command: ["stack", "select", env],
        args: {
            create: true,
            secretsProvider: PULUMI_SECRETS_PROVIDER
        },
        execa: {
            env: {
                PULUMI_CONFIG_PASSPHRASE
            }
        }
    });

    await runHook({
        hook: "hook-before-deploy",
        skip: inputs.preview,
        args: hookArgs,
        context
    });

    console.log();
    const continuing = inputs.preview ? `Previewing deployment...` : `Deploying...`;
    context.info(continuing);
    console.log();

    if (inputs.preview) {
        await pulumi.run({
            command: "preview",
            args: {
                debug: inputs.debug
                // Preview command does not accept "--secrets-provider" argument.
                // secretsProvider: PULUMI_SECRETS_PROVIDER
            },
            execa: {
                stdio: "inherit",
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.project.name,
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });
    } else {
        await pulumi.run({
            command: "up",
            args: {
                yes: true,
                skipPreview: true,
                secretsProvider: PULUMI_SECRETS_PROVIDER,
                debug: inputs.debug
            },
            execa: {
                // We pipe "stderr" so that we can intercept potential received error messages,
                // and hopefully, show extra information / help to the user.
                stdio: ["inherit", "inherit", "pipe"],
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.project.name,
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });
    }

    const duration = getDuration();
    if (inputs.preview) {
        context.success(`Done! Preview finished in ${green(duration)}.`);
    } else {
        context.success(`Done! Deploy finished in ${green(duration)}.`);
    }

    console.log();

    await runHook({
        hook: "hook-after-deploy",
        skip: inputs.preview,
        args: hookArgs,
        context
    });

    notify({ message: `"${folder}" stack deployed in ${duration}.` });
};

async function runHook({ hook, skip, args, context }) {
    if (skip) {
        context.info(`Skipped "${hook}" hook.`);
    } else {
        context.info(`Running "${hook}" hook...`);
        await processHooks(hook, args);
        context.success(`Hook "${hook}" completed.`);
    }
}
