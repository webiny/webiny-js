import type { Context, IUserCommandInput, ProjectApplication } from "~/types";
import os from "os";
import fs from "fs";
import chalk from "chalk";
import path from "path";
import { getProject, getProjectApplication } from "@webiny/cli/utils";
import get from "lodash/get";
import merge from "lodash/merge";
import simpleOutput from "./watch/output/simpleOutput";
import { listPackages } from "./watch/listPackages";
import glob from "fast-glob";
import { watchPackages } from "./watch/watchPackages";
import { PackagesWatcher } from "./watch/watchers/PackagesWatcher";
import {
    getPulumi,
    getRandomColorForString,
    getStackName,
    loadEnvVariables,
    login,
    runHook
} from "~/utils";
import {
    createEnvConfiguration,
    withEnv,
    withEnvVariant,
    withProjectName,
    withPulumiConfigPassphrase,
    withRegion
} from "~/utils/env";

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

const PULUMI_WATCH_SUPPORTED = os.platform() !== "win32";

// Note: we are not using `createPulumiCommand` here because this command has a bit specific
// behaviour which is not encapsulated by `createPulumiCommand`. Maybe we can improve in the future.
export const watchCommand = async (inputs: IUserCommandInput, context: Context) => {
    context.info(
        `With the %s release, we've introduced %s — a major update to the %s command and the overall backend development experience. This feature is currently in beta, but if you're interested in trying it out or learning more, check out the docs: https://webiny.link/local-aws-lambda-development`,
        "5.41.0",
        "local AWS Lambda development",
        "webiny watch"
    );

    console.log();

    // 1. Initial checks for deploy and build commands.
    if (!inputs.folder && !inputs.package) {
        throw new Error(
            `Either "folder" or "package" arguments must be passed. Cannot have both undefined.`
        );
    }

    let projectApplication: ProjectApplication | undefined;
    if (inputs.folder) {
        // Detect if an app alias was provided.
        const project = getProject();
        if (project.config.appAliases) {
            const appAliases = project.config.appAliases;
            if (appAliases[inputs.folder]) {
                inputs.folder = appAliases[inputs.folder];
            }
        }

        // Get project application metadata. Will throw an error if invalid folder specified.
        projectApplication = getProjectApplication({
            cwd: path.join(process.cwd(), inputs.folder)
        });

        // If exists - read default inputs from "webiny.application.ts" file.
        inputs = merge({}, get(projectApplication, "config.cli.watch"), inputs);

        // Check if there are any plugins that need to be registered.
        if (projectApplication.config.plugins) {
            context.plugins.register(projectApplication.config.plugins);
        }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);
    }

    inputs.build = inputs.build !== false;
    inputs.deploy = projectApplication && inputs.deploy !== false;

    if (inputs.deploy && !inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (WATCH_DISABLED_ENVIRONMENTS.includes(inputs.env)) {
        if (!inputs.allowProduction) {
            throw new Error(
                `${chalk.red("webiny watch")} command cannot be used with production environments.`
            );
        }
    }

    if (!inputs.build && !inputs.deploy) {
        throw new Error(`Both re-build and re-deploy actions were disabled, can't continue.`);
    }

    const hookArgs = {
        context,
        env: inputs.env,
        variant: inputs.variant,
        inputs,
        projectApplication
    };

    await runHook({
        hook: "hook-before-watch",
        args: hookArgs,
        context
    });

    console.log();

    // TODO: separate the rest of the code below into separate "watcher" classes.
    // TODO: This was done just because of the time constraints.
    if (!inputs.deploy) {
        const packages = await listPackages({ inputs });
        const packagesWatcher = new PackagesWatcher({ packages, context, inputs });
        await packagesWatcher.watch();
        return;
    }

    // 1.1. Check if the project application and Pulumi stack exist.
    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

    if (inputs.deploy && projectApplication) {
        const { env, variant } = inputs;

        await login(projectApplication);

        const pulumi = await getPulumi({ projectApplication });

        const stackName = getStackName({
            env,
            variant
        });

        let stackExists = true;
        try {
            await pulumi.run({
                command: ["stack", "select", stackName],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: createEnvConfiguration({
                        configurations: [withPulumiConfigPassphrase()]
                    })
                }
            });
        } catch {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(`Please specify an existing environment, for example "dev".`);
        }
    }

    const output = simpleOutput;

    if (typeof output.initialize === "function") {
        output.initialize(inputs);
    }

    // Add deploy logs.
    if (inputs.deploy && projectApplication) {
        try {
            output.log({
                type: "deploy",
                message: chalk.green("Watching cloud infrastructure resources...")
            });

            const buildFoldersGlob = [projectApplication.paths.workspace, "**/build/*.js"].join(
                "/"
            );

            const buildFolders = glob.sync(buildFoldersGlob, { onlyFiles: false });

            // The final array of values that will be sent to Pulumi CLI's "--path" argument.
            // NOTE: for Windows, there's a bug in Pulumi preventing us to use path filtering.
            let pathArg: string[] | undefined = undefined;
            if (PULUMI_WATCH_SUPPORTED) {
                pathArg = [...buildFolders];

                const pulumiFolder = path.join(projectApplication.root, "pulumi");
                if (fs.existsSync(pulumiFolder)) {
                    pathArg.push(pulumiFolder);
                }
            }

            // Log used values if debugging has been enabled.
            if (inputs.debug) {
                const message = pathArg
                    ? [
                          "The following files and folders are being watched:",
                          ...pathArg.map(p => "\n‣ " + p)
                      ].join("\n")
                    : `Watching ${projectApplication.root}.`;

                output.log({
                    type: "deploy",
                    message
                });
            }

            const pulumi = await getPulumi({ projectApplication });

            const watchCloudInfrastructure = pulumi.run({
                command: "watch",
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER,
                    color: "always",
                    path: pathArg,
                    debug: !!inputs.debug
                },
                execa: {
                    env: createEnvConfiguration({
                        configurations: [
                            withRegion(inputs),
                            withEnv(inputs),
                            withEnvVariant(inputs),
                            withProjectName(context)
                        ]
                    })
                }
            });
            watchCloudInfrastructure.stdout!.on("data", data => {
                const lines: string[] = data.toString().split("\n");
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    try {
                        const [, , name, message] = line
                            /**
                             * TODO @adrian
                             *
                             * Check this out.
                             */
                            // added ! at the end of next line
                            .match(/(.*)\[(.*)\] (.*)/)!
                            .map(item => item.trim());

                        if (name) {
                            const coloredName = chalk.hex(getRandomColorForString(name)).bold(name);
                            output.log({
                                type: "deploy",
                                message: `${coloredName}: ${message}`
                            });
                        } else {
                            output.log({
                                type: "deploy",
                                message
                            });
                        }
                    } catch {
                        output.log({
                            type: "deploy",
                            message: line
                        });
                    }
                }
            });

            watchCloudInfrastructure.stderr!.on("data", data => {
                output.log({
                    type: "deploy",
                    message: data.toString()
                });
            });
        } catch (e) {
            output.log({
                type: "deploy",
                message: chalk.red(e.message)
            });

            if (inputs.debug) {
                output.log({
                    type: "deploy",
                    message: chalk.red(e.stack)
                });
            }
        }
    }

    if (inputs.build) {
        try {
            await watchPackages({
                inputs,
                context,
                output
            });
        } catch (e) {
            output.log({
                type: "build",
                message: chalk.red(e.message)
            });

            if (inputs.debug) {
                output.log({
                    type: "build",
                    message: chalk.red(e.stack)
                });
            }
        }
    }
};
