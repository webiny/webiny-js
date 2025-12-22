import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import {
    createEnvOption,
    createRegionOption,
    createVariantOption
} from "~/features/common/index.js";
import chalk from "chalk";
import { getRandomColorForString } from "./getRandomColorForString.js";
import { createPrefixer } from "./createPrefixer.js";

export type IWatchCommandParams = IBaseAppParams;

const BASE_OPTIONS_GROUP = "Base Options:";
const LOCAL_AWS_LAMBDA_DEVELOPMENT_GROUP = "Local AWS Lambda Development Options:";

export class WatchCommand implements CliCommand.Interface<IWatchCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IWatchCommandParams>> {
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
                createEnvOption({
                    group: BASE_OPTIONS_GROUP
                }),
                createVariantOption(projectSdk, {
                    group: BASE_OPTIONS_GROUP,
                    description: "Variant of the app to watch"
                }),
                createRegionOption(projectSdk, {
                    group: BASE_OPTIONS_GROUP
                }),
                {
                    name: "package",
                    alias: "p",
                    description: `One or more packages that will be watched for code changes`,
                    type: "string",
                    group: BASE_OPTIONS_GROUP
                },
                {
                    name: "function",
                    alias: "f",
                    description:
                        "Specify one or more AWS Lambda functions to watch (comma-separated)",
                    type: "string",
                    group: LOCAL_AWS_LAMBDA_DEVELOPMENT_GROUP
                },
                {
                    name: "increase-timeout",
                    default: 120,
                    description:
                        "Increase AWS Lambda function timeout (passed as number of seconds)",
                    type: "number",
                    group: LOCAL_AWS_LAMBDA_DEVELOPMENT_GROUP
                },
                {
                    name: "increase-handshake-timeout",
                    default: 5,
                    description:
                        "Increase timeout for the initial handshake between a single AWS Lambda invocation and local code execution (passed as number of seconds)",
                    type: "number",
                    group: LOCAL_AWS_LAMBDA_DEVELOPMENT_GROUP
                },
                {
                    name: "inspect",
                    alias: "i",
                    description: "[EXPERIMENTAL] Enable Node debugger",
                    type: "string",
                    group: LOCAL_AWS_LAMBDA_DEVELOPMENT_GROUP
                },
                {
                    name: "allow-production",
                    default: false,
                    description:
                        "Enables running the watch command against environments marked as production environments (not recommended).",
                    type: "number"
                },
                {
                    name: "deployment-checks",
                    default: true,
                    description: `Enable or disable deployment checks. For example, if you are trying to watch the API app, but the 'api' app is not deployed yet, you will get a warning and the process will stop.`,
                    type: "boolean"
                }
            ],
            handler: async (params: IWatchCommandParams) => {
                const { packagesWatcher } = await projectSdk.watch(params);

                // TODO: Revisit this.
                // if (webinyConfigWatcher) {
                //     webinyConfigWatcher
                //         .onError(err => {
                //             ui.error(
                //                 `There is an error in your %s file: ${err.message}`,
                //                 "webiny.config.tsx"
                //             );
                //         })
                //         .onSuccess(() => {
                //             ui.success(`%s compiled successfully!`, "webiny.config.tsx");
                //         })
                //         .run();
                // }

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
                    ui.info(`Watching %s packages...`, watchProcesses.length);

                    stdio.getStdout().setMaxListeners(20);
                    stdio.getStderr().setMaxListeners(20);

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
    abstraction: CliCommand,
    implementation: WatchCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});
