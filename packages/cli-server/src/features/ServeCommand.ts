import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";
import { colorForString, createPrefixer } from "./terminalPrefix.js";
import {
    prepareDevServerSession,
    readDevServerTargets,
    startDevProxy
} from "@webiny/project-server/serve/devServer/index.js";

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
                "Serves built apps as long-running servers (production). Serves both api and admin if no app is specified.",
                "",
                "Serving both puts a proxy in front of them, so there is one URL to publish: it serves",
                "admin, and forwards /api to the api. The proxy takes WEBINY_PORT (else PORT, else the",
                "port this project used last time, else the first free port from 3001), and gives api and",
                "admin ports of their own. Pass --no-proxy (or set WEBINY_PROXY=off) to serve the apps on",
                "separate ports instead.",
                "",
                "Ports, when running without the proxy:",
                " ‣ api:   WEBINY_API_PORT (else PORT, else 3002)",
                " ‣ admin: WEBINY_ADMIN_PORT (else PORT, else 3001)",
                "PORT applies only when serving a single app (serve api / serve admin).",
                "Explicit ports are strict; the defaults auto-advance to the next free port."
            ].join("\n"),
            examples: [
                "serve",
                "serve api",
                "serve admin",
                "WEBINY_PORT=8000 serve",
                "WEBINY_API_PORT=8000 serve api",
                "serve --no-proxy"
            ],
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
                        "Put a single-port proxy in front of the served apps (default: on when serving both)",
                    type: "boolean",
                    default: true
                }
            ],
            handler: async (params: IServeCommandParams) => {
                const stdio = this.stdioService;

                // Before the SDK is initialized, so the env it writes wins over webiny.config. See
                // prepareDevServerSession.
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

                const proxy = session
                    ? await startDevProxy({ port: session.port, ...readDevServerTargets() })
                    : undefined;

                if (proxy) {
                    this.uiService.info(`Webiny is available at %s`, proxy.url);
                }

                try {
                    await Promise.all(processes.map(p => p.run()));
                } finally {
                    await proxy?.close();
                }
            }
        };
    }
}

export const serverServeCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerServeCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});
