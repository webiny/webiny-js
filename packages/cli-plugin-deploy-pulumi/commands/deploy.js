const buildPackages = require("./deploy/buildPackages");
const { createPulumiCommand, runHook, login, notify } = require("../utils");
const { BeforeDeployPlugin } = require("../plugins/BeforeDeployPlugin");

module.exports = (params, context) => {
    const command = createPulumiCommand({
        name: "deploy",
        createProjectApplicationWorkspace: params.build,
        telemetry: true,
        command: async ({ inputs, context, projectApplication, pulumi, getDuration }) => {
            const { env, folder, build, deploy } = inputs;

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
                hook: BeforeDeployPlugin.type,
                args: hookArgs,
                context
            });

            console.log();
            const actionTaken = inputs.preview ? `Previewing deployment...` : `Deploying...`;
            context.info(actionTaken);
            console.log();

            if (inputs.preview) {
                const subprocess = pulumi.run({
                    command: "preview",
                    args: {
                        diff: true,
                        debug: inputs.debug
                        // Preview command does not accept "--secrets-provider" argument.
                        // secretsProvider: PULUMI_SECRETS_PROVIDER
                    },
                    execa: {
                        env: {
                            WEBINY_ENV: env,
                            WEBINY_PROJECT_NAME: context.project.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });

                subprocess.stdout.pipe(process.stdout);
                subprocess.stderr.pipe(process.stderr);

                await subprocess;
            } else {
                const subprocess = pulumi.run({
                    command: "up",
                    args: {
                        yes: true,
                        skipPreview: true,
                        secretsProvider: PULUMI_SECRETS_PROVIDER,
                        debug: inputs.debug
                    },
                    execa: {
                        env: {
                            WEBINY_ENV: env,
                            WEBINY_PROJECT_NAME: context.project.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });

                subprocess.stdout.pipe(process.stdout);
                subprocess.stderr.pipe(process.stderr);

                await subprocess;
            }

            const duration = getDuration();
            if (inputs.preview) {
                context.success(`Done! Preview finished in %s.`, duration);
            } else {
                context.success(`Done! Deploy finished in %s.`, duration);
            }

            console.log();

            await runHook({
                hook: "hook-after-deploy",
                args: hookArgs,
                context
            });

            notify({ message: `"${folder}" stack deployed in ${duration}.` });
        }
    });

    return command(params, context);
};
