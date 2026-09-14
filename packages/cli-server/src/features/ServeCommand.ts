import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";
import { colorForString, createPrefixer } from "./terminalPrefix.js";
import { prepareDevServerSession } from "@webiny/project-server/serve/devServer/index.js";

interface IServeCommandParams {
    _: string[];
    app?: string;
    proxy?: boolean;
}

export class ServerServeCommand implements CliCommandFactory.Interface<IServeCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IServeCommandParams>> {
        return {
            name: "serve",
            description: [
                "Serves your built Webiny project on a single URL.",
                "",
                "Set PORT to choose which port that URL uses. Run `webiny-server build` first."
            ].join("\n"),
            examples: ["serve", "serve api", "serve admin", "PORT=8000 serve"],
            params: [
                {
                    name: "app",
                    description: "Name of the app to serve (api or admin). Serves both if omitted.",
                    type: "string"
                }
            ],
            options: [
                {
                    name: "proxy",
                    description:
                        "Serve the project on a single URL (default). Turn off to run each app on its own port",
                    type: "boolean",
                    default: true
                }
            ],
            handler: async (params: IServeCommandParams) => {
                const stdio = this.stdioService;

                // Ports only. Unlike watch, serve runs what `webiny build` already produced, so the
                // admin bundle's API URL was fixed at build time and can't be pointed anywhere now —
                // it has to have been built with a URL that works behind the proxy.
                const session = await prepareDevServerSession({
                    apps: params.app ? [params.app] : ["api", "admin"],
                    enabled: params.proxy
                });

                const projectSdk = await this.getProjectSdkService.execute();

                // The project layer describes the server process(es) (lazy ServersWatcher); the CLI
                // prepares + runs them, owning terminal rendering (prefixing) and lifecycle — same
                // split as the watch command.
                const { serversWatcher } = await projectSdk.serve({ app: params.app as any });
                const processes = serversWatcher.prepare();
                if (processes.length === 0) {
                    return;
                }

                stdio.getStdout().setMaxListeners(processes.length + 5);
                stdio.getStderr().setMaxListeners(processes.length + 5);

                for (const serverProcess of processes) {
                    const prefix = chalk.hex(colorForString(serverProcess.name))(
                        serverProcess.name
                    );
                    serverProcess.pipeStdout(stdout => {
                        stdout.pipe(createPrefixer(prefix)).pipe(stdio.getStdout());
                    });
                    serverProcess.pipeStderr(stderr => {
                        stderr.pipe(createPrefixer(prefix)).pipe(stdio.getStderr());
                    });
                }

                if (session) {
                    this.uiService.info(`Webiny is available at %s`, session.url);
                }

                await Promise.all(processes.map(p => p.run()));
            }
        };
    }
}

export const serverServeCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerServeCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});
