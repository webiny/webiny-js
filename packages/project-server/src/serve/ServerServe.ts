import { createImplementation } from "@webiny/di";
import { GetApp, Serve, UiService } from "@webiny/project/abstractions/index.js";
import { runApiServer } from "./runApiServer.js";
import { runAdminServer } from "./runAdminServer.js";

/**
 * Server-flavour Serve implementation: spawns the server process(es) for the requested app(s) and
 * returns them for the CLI to render + await. Replaces the base DefaultServe (which refuses).
 * api = HTTP handler; admin = static SPA; no app = both. Build checks run via a decorator
 * (serveWithBuildChecks); terminal rendering + lifecycle are the CLI's job.
 */
export class ServerServe implements Serve.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(params: Serve.Params): Promise<Serve.Result> {
        const serveApi = !params.app || params.app === "api";
        const serveAdmin = !params.app || params.app === "admin";

        if (!serveApi && !serveAdmin) {
            this.ui.warning(
                `Unknown app %s. Run one of: %s, %s, or %s.`,
                `"${params.app}"`,
                "webiny-server serve",
                "webiny-server serve api",
                "webiny-server serve admin"
            );
            return { processes: [] };
        }

        // Serving both in one process: ignore a generic injected PORT so api and admin don't both
        // grab it — each falls back to its own dedicated port.
        const both = serveApi && serveAdmin;
        const processes: Serve.Process[] = [];

        if (serveApi) {
            const child = await runApiServer(this.getApp.execute("api"), {
                watch: false,
                ignoreGenericPort: both
            });
            processes.push({ name: "api", child });
        }

        if (serveAdmin) {
            const child = await runAdminServer(this.getApp.execute("admin"), {
                ignoreGenericPort: both
            });
            processes.push({ name: "admin", child });
        }

        return { processes };
    }
}

export const serverServe = createImplementation({
    abstraction: Serve,
    implementation: ServerServe,
    dependencies: [GetApp, UiService]
});
