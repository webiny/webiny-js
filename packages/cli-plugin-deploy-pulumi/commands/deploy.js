const buildPackages = require("./deploy/buildPackages");
const { createPulumiCommand, runHook, login, notify } = require("../utils");

module.exports = (params, context) => {
    const command = createPulumiCommand({
        name: "deploy",
        createProjectApplicationWorkspace: params.build,
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
                hook: "hook-before-deploy",
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
                        diff: true,
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
