const { createPulumiCommand, runHook, login, notify } = require("../utils");
const { BeforeDeployPlugin } = require("../plugins/BeforeDeployPlugin");
const ora = require("ora");
const { PackagesBuilder } = require("./buildPackages/PackagesBuilder");

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

                console.log();

                const builder = new PackagesBuilder({
                    packages: projectApplication.packages,
                    inputs,
                    context
                });

                await builder.build();

                console.log();

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

            await runHook({
                hook: BeforeDeployPlugin.type,
                args: hookArgs,
                context
            });

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

            const actionTaken = inputs.preview ? `Previewing deployment...` : `Deploying...`;
            console.log();

            const spinner = ora(actionTaken).start();

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

                // subprocess.stdout.pipe(process.stdout);
                // subprocess.stderr.pipe(process.stderr);

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

                // subprocess.stdout.pipe(process.stdout);
                // subprocess.stderr.pipe(process.stderr);

                await subprocess;
            }

            const duration = getDuration();
            let message = `Done! Deploy finished in ${duration}.`;
            if (inputs.preview) {
                message = `Done! Preview finished in ${duration}.`;
            }

            spinner.succeed(message);

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
