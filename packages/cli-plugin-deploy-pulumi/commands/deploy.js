const path = require("path");
const { green } = require("chalk");
const { loadEnvVariables, getPulumi, processHooks, login, notify } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");
const buildPackages = require("./deploy/buildPackages");
const { ApplicationBuilderGeneric, ApplicationBuilderLegacy } = require("@webiny/pulumi-sdk");

module.exports = async (inputs, context) => {
    const { env, folder, build, deploy, variant } = inputs;

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

    await loadEnvVariables(inputs, context);

    const hookArgs = { context, env, variant, inputs, projectApplication };

    const application =
        projectApplication.config instanceof ApplicationBuilderGeneric
            ? projectApplication.config
            : new ApplicationBuilderLegacy(projectApplication.config);

    if (build) {
        await runHook({
            hookName: "hook-before-build",
            hookFn: application.onBeforeBuild,
            args: hookArgs,
            context
        });

        await buildPackages({ projectApplication, inputs, context });

        await runHook({
            hookName: "hook-after-build",
            hookFn: application.onAfterBuild,
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


    await runHook({
        hookName: "hook-before-deploy",
        hookFn: application.onBeforeDeploy,
        skip: inputs.preview,
        args: hookArgs,
        context
    });

    await login(projectApplication);

    const pulumi = await getPulumi({
        folder: inputs.folder
    });

    const stack = await application.createOrSelectStack({
        appDir: projectApplication.root,
        projectDir: projectApplication.project.root,
        env,
        variant,
        pulumi: pulumi
    });

    if (stack.app) {
        // This is basically a hack to fix issue with pulumi context changing during deploy.
        // If we run getStackOutput inside pulumi app it changes current pulumi context to other app.
        // That causes errors on deploy.
        // Legit fix would be to have a single pulumi login for all the apps, instead of logging to each app separately.
        // Currently we just add logging back to the app we deploy as a last handler in the app.
        stack.app.addHandler(async () => {
            await login(projectApplication);
        });
    }

    console.log();
    const continuing = inputs.preview ? `Previewing deployment...` : `Deploying...`;
    context.info(continuing);
    console.log();

    if (inputs.refresh) {
        await stack.refresh();
    }

    if (inputs.preview) {
        await stack.preview();
    } else {
        await stack.up();
    }

    const duration = getDuration();
    if (inputs.preview) {
        context.success(`Done! Preview finished in ${green(duration)}.`);
    } else {
        context.success(`Done! Deploy finished in ${green(duration)}.`);
    }

    console.log();

    await runHook({
        hookName: "hook-after-deploy",
        hookFn: application.onAfterDeploy,
        skip: inputs.preview,
        args: hookArgs,
        context
    });

    notify({ message: `"${folder}" stack deployed in ${duration}.` });
};

async function runHook({ hookName, hookFn, skip, args, context }) {
    if (skip) {
        context.info(`Skipped "${hookName}" hook.`);
    } else {
        context.info(`Running "${hookName}" hook...`);
        // run the application defined hook
        if (hookFn) {
            const { context, ...options } = args;
            await hookFn(options, context);
        }
        await processHooks(hookName, args);
        context.success(`Hook "${hookName}" completed.`);
    }
}
