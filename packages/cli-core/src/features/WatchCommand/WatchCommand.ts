import { createImplementation } from "@webiny/di-container";
import { Command, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import chalk from "chalk";
import { getRandomColorForString } from "./getRandomColorForString.js";
import { createPrefixer } from "./createPrefixer.js";

export type IWatchCommandParams = IBaseAppParams;

export class WatchCommand implements Command.Interface<IWatchCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<IWatchCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();
        const stdio = this.stdioService;
        const ui = this.uiService;

        return {
            name: "watch",
            description: "Watches code changes for a specific app or package.",
            examples: [
                "watch api --env dev",
                "watch admin --env prod",
                "watch -p my-package1,my-package2",
                "watch api --env dev -p my-package1,my-package2"
            ],
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string"
                }
            ],
            options: [
                {
                    name: "env",
                    description: "Environment name (dev, prod, etc.)",
                    type: "string"
                },
                {
                    name: "variant",
                    description: "Variant of the app to watch",
                    type: "string",
                    validation: params => {
                        const isValid = projectSdk.isValidVariantName(params.variant);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                },
                {
                    name: "region",
                    description: "Region to target",
                    type: "string",
                    validation: params => {
                        const isValid = projectSdk.isValidRegionName(params.region);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                },
                {
                    name: "package",
                    alias: "p",
                    description: `One or more packages that will be watched for code changes`,
                    type: "string"
                },
                {
                    name: "function",
                    alias: "f",
                    description:
                        "One or more functions that will invoked locally (used with local AWS Lambda development)",
                    type: "string"
                },
                {
                    name: "inspect",
                    alias: "i",
                    description:
                        "[EXPERIMENTAL] Enable Node debugger (used with local AWS Lambda development)",
                    type: "string"
                },
                {
                    name: "increase-timeout",
                    default: 120,
                    description:
                        "Increase AWS Lambda function timeout (passed as number of seconds, used with local AWS Lambda development)",
                    type: "number"
                },
                {
                    name: "increase-handshake-timeout",
                    default: 5,
                    description:
                        "Increase timeout for the initial handshake between a single AWS Lambda invocation and local code execution (passed as number of seconds, used with local AWS Lambda development)",
                    type: "number"
                },
                {
                    name: "allow-production",
                    default: false,
                    description:
                        "Enables running the watch command against environments marked as production environments (not recommended).",
                    type: "number"
                }
            ],
            handler: async (params: IWatchCommandParams) => {
                const { packagesWatcher, webinyConfigWatcher } = await projectSdk.watch(params);

                if (webinyConfigWatcher) {
                    webinyConfigWatcher
                        .onError(err => {
                            ui.error(
                                `There is an error in your %s file: ${err.message}`,
                                "webiny.config.tsx"
                            );
                        })
                        .onSuccess(() => {
                            ui.success(`%s compiled successfully!`, "webiny.config.tsx");
                        })
                        .run();
                }

                // TODO: Extract this logic into WatchRunners, same thing we have with BuildRunners.
                const watchProcesses = packagesWatcher.prepare();
                if (watchProcesses.length === 1) {
                    watchProcesses.setForkOptions({
                        stdio: "inherit",
                        env: process.env
                    });

                    const [firstProcess] = watchProcesses.getProcesses();
                    ui.info(`Watching %s package...`, firstProcess.pkg.name);

                    await firstProcess.run();
                    return;
                }

                if (watchProcesses.length > 1) {
                    ui.info(
                        `Watching ${watchProcesses.length} packages. Output will be displayed below:\n`
                    );

                    watchProcesses.forEach(watchProcess => {
                        const { pkg } = watchProcess;
                        const pkgPrefix = chalk.hex(getRandomColorForString(pkg.name))(pkg.name);

                        watchProcess.pipeStdout(stdout => {
                            const prefixedStdout = createPrefixer(pkgPrefix);
                            stdout.pipe(prefixedStdout).pipe(stdio.getStdout());
                        });

                        watchProcess.pipeStderr(stderr => {
                            const prefixedStderr = createPrefixer(pkgPrefix);
                            stderr.pipe(prefixedStderr).pipe(stdio.getStderr());
                        });
                    });

                    await Promise.all(watchProcesses.run());
                    return;
                }

                ui.warning(
                    `No watch processes were started. Please ensure that you have specified valid "app" or "package" parameters.`
                );
            }
        };
    }
}

export const watchCommand = createImplementation({
    abstraction: Command,
    implementation: WatchCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});
