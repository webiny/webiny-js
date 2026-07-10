import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";
import { colorForString, createPrefixer } from "./terminalPrefix.js";

interface IServerWatchCommandParams {
    _: string[];
    app?: string;
    package?: string | string[];
}

export class ServerWatchCommand implements CliCommandFactory.Interface<IServerWatchCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IServerWatchCommandParams>> {
        return {
            name: "watch",
            description:
                "Watches code changes for a specific app or package. Watches all default apps if none specified.",
            examples: ["watch api", "watch admin", "watch -p my-package", "watch"],
            params: [
                {
                    name: "app",
                    description: "Name of the app to watch (api or admin)",
                    type: "string"
                }
            ],
            options: [
                {
                    name: "package",
                    alias: "p",
                    description: "One or more packages to watch for code changes",
                    type: "string"
                }
            ],
            handler: async (params: IServerWatchCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const stdio = this.stdioService;
                const ui = this.uiService;

                // Watching both apps at once isn't supported yet — the combined output is still
                // rough. Require an explicit app (or a package whitelist) and run them separately.
                if (!params.app && !params.package) {
                    ui.warning(
                        `Watching all apps at once is not supported yet. Run them separately, e.g. %s and %s.`,
                        "webiny-server watch api",
                        "webiny-server watch admin"
                    );
                    return;
                }

                // Decide which apps to watch.
                const apps = params.app ? [params.app] : [];

                // Collect PackagesWatcher instances — one per app or for package-only mode.
                const watchers = [];

                if (apps.length > 0) {
                    for (const app of apps) {
                        const { packagesWatcher } = await projectSdk.watch({ app: app as any });
                        watchers.push(packagesWatcher);
                    }
                } else {
                    const whitelist = Array.isArray(params.package)
                        ? params.package
                        : ([params.package].filter(Boolean) as string[]);
                    const { packagesWatcher } = await projectSdk.watch({ package: whitelist });
                    watchers.push(packagesWatcher);
                }

                // Flatten processes from all watchers.
                const allProcessLists = watchers.map(w => w.prepare());
                const allProcesses = allProcessLists.flatMap(pl =>
                    pl.getProcesses ? pl.getProcesses() : []
                );

                if (allProcesses.length === 0) {
                    ui.warning(
                        `No watch processes were started. Please ensure you have specified a valid "app" or "package" parameter.`
                    );
                    return;
                }

                if (allProcesses.length === 1) {
                    allProcessLists[0].setForkOptions({ stdio: "inherit", env: process.env });
                    ui.info(`Watching %s package...`, allProcesses[0].pkg.name);
                    await allProcesses[0].run();
                    return;
                }

                ui.info(`Watching %s packages...`, allProcesses.length);

                stdio.getStdout().setMaxListeners(allProcesses.length + 5);
                stdio.getStderr().setMaxListeners(allProcesses.length + 5);

                for (const watchProcess of allProcesses) {
                    const prefix = chalk.hex(colorForString(watchProcess.pkg.name))(
                        watchProcess.pkg.name
                    );

                    watchProcess.pipeStdout(stdout => {
                        stdout.pipe(createPrefixer(prefix)).pipe(stdio.getStdout());
                    });

                    watchProcess.pipeStderr(stderr => {
                        stderr.pipe(createPrefixer(prefix)).pipe(stdio.getStderr());
                    });
                }

                await Promise.all(allProcesses.map(p => p.run()));
            }
        };
    }
}

export const serverWatchCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerWatchCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});
