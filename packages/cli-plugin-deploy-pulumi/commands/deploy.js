const { createPulumiCommand, runHook, login, notify } = require("../utils");
const { BeforeDeployPlugin } = require("../plugins/BeforeDeployPlugin");
const ora = require("ora");
const { PackagesBuilder } = require("./buildPackages/PackagesBuilder");

const spinnerMessages = [
    [60, "Still deploying..."],
    [120, "Still deploying, please wait..."],
    [180, "Some resources take some time to become ready, please wait..."],

    [270, "Still deploying, please don't interrupt..."],
    [360, "Still deploying, please be patient..."],
    [450, "Still deploying, please don't interrupt..."],
    [540, "Still deploying, please be patient..."],

    [600, "Deploying for 10 minutes now, probably a couple more to go..."],
    [720, "Still deploying, shouldn't be much longer now..."],

    [840, "Looks like it's taking a bit longer than usual, please wait..."],
    [900, "Deploying for 15 minutes now, hopefully it's almost done..."],

    [1200, "Deploying for 20 minutes now, hopefully it's almost done..."]
];

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

            console.log();

            // We always show deployment logs when doing previews.
            const showDeploymentLogs = inputs.preview || inputs.deploymentLogs;
            const actionTaken = inputs.preview ? `Previewing deployment...` : `Deploying...`;

            const spinner = ora(actionTaken);
            if (!showDeploymentLogs) {
                spinner.start();
            }

            try {
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

                    if (showDeploymentLogs) {
                        subprocess.stdout.pipe(process.stdout);
                        subprocess.stderr.pipe(process.stderr);
                        await subprocess;
                    } else {
                        // When showing spinner, we want to show a few messages to the user.
                        // The deployment process can take in some cases 10-15 minutes, so we want to
                        // give the user some feedback.
                        const timeouts = spinnerMessages.map(([seconds, message]) => {
                            return setTimeout(() => {
                                spinner.text = message;
                            }, seconds * 1000);
                        });

                        // Every second, let's add a dot to the end of the message. Once we reach
                        // three, we start over.
                        const interval = setInterval(() => {
                            const spinnerText = spinner.text;
                            if (spinnerText.endsWith("...")) {
                                spinner.text = spinnerText.substring(0, spinnerText.length - 3);
                            } else {
                                spinner.text = spinnerText + ".";
                            }
                        }, 1000);

                        try {
                            await subprocess;
                        } finally {
                            timeouts.forEach(clearTimeout);
                            clearInterval(interval);
                        }
                    }
                }

                const duration = getDuration();
                let message = `Done! Deploy finished in ${duration}.`;
                if (inputs.preview) {
                    message = `Done! Preview finished in ${duration}.`;
                }

                if (showDeploymentLogs) {
                    context.success(message);
                } else {
                    spinner.succeed(message);
                }
            } catch (e) {
                if (showDeploymentLogs) {
                    throw e;
                }

                spinner.fail("Deployment failed. Please check the below logs for more details.");
                console.log();
                console.log(e.stderr || e.stdout || e.message);
                throw e;
            }

            console.log();

            await runHook({
                hook: "hook-after-deploy",
                args: hookArgs,
                context
            });

            notify({ message: `"${folder}" stack deployed in ${getDuration()}.` });
        }
    });

    return command(params, context);
};
