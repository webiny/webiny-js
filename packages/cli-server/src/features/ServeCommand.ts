import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";
import { colorForString, createPrefixer } from "./terminalPrefix.js";
import { waitForExit } from "./serverProcesses.js";

interface IServeCommandParams {
    _: string[];
    app?: string;
}

export class ServerServeCommand implements CliCommandFactory.Interface<IServeCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IServeCommandParams>> {
        return {
            name: "serve",
            description: [
                "Serves built apps as long-running servers (production). Serves both api and admin if no app is specified.",
                "",
                "Ports:",
                " ‣ api:   WEBINY_API_PORT (else PORT, else 3002)",
                " ‣ admin: WEBINY_ADMIN_PORT (else PORT, else 3001)",
                "PORT applies only when serving a single app (serve api / serve admin). When serving both",
                "at once (no app), PORT is ignored — set WEBINY_API_PORT / WEBINY_ADMIN_PORT instead.",
                "Explicit ports are strict; the defaults auto-advance to the next free port."
            ].join("\n"),
            examples: [
                "serve",
                "serve api",
                "serve admin",
                "WEBINY_API_PORT=8000 serve api",
                "WEBINY_API_PORT=8000 WEBINY_ADMIN_PORT=8001 serve"
            ],
            params: [
                {
                    name: "app",
                    description: "Name of the app to serve (api or admin). Serves both if omitted.",
                    type: "string"
                }
            ],
            handler: async (params: IServeCommandParams) => {
                const stdio = this.stdioService;
                const projectSdk = await this.getProjectSdkService.execute();

                // The project layer spawns the server process(es); the CLI owns terminal rendering
                // (prefixing) and lifecycle (awaiting exit) — same split as the watch command.
                const { processes } = await projectSdk.serve({ app: params.app as any });
                if (processes.length === 0) {
                    return;
                }

                stdio.getStdout().setMaxListeners(processes.length + 5);
                stdio.getStderr().setMaxListeners(processes.length + 5);

                for (const { name, child } of processes) {
                    const prefix = chalk.hex(colorForString(name))(name);
                    child.stdout?.pipe(createPrefixer(prefix)).pipe(stdio.getStdout());
                    child.stderr?.pipe(createPrefixer(prefix)).pipe(stdio.getStderr());
                }

                await Promise.all(processes.map(({ name, child }) => waitForExit(name, child)));
            }
        };
    }
}

export const serverServeCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerServeCommand,
    dependencies: [GetProjectSdkService, StdioService]
});
