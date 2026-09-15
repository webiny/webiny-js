import { createImplementation } from "@webiny/di";
import { GetApp, Serve, UiService } from "@webiny/project/abstractions/index.js";
import {
    ServersWatcher,
    type IServerProcessSpec
} from "@webiny/project/features/Watch/watchers/ServersWatcher.js";
import { runApiServer } from "./runApiServer.js";
import { runAdminServer } from "./runAdminServer.js";
import { runDevProxy } from "./runDevProxy.js";
import { getDevServerSession } from "./devServer/index.js";

/**
 * Server hosting-type Serve implementation: describes the server process(es) for the requested app(s) as
 * a `ServersWatcher` (lazy — nothing spawns until the caller runs them) and returns it. Replaces the
 * base DefaultServe (which refuses). api = HTTP handler; admin = static SPA; no app = both. Build
 * checks run via a decorator (serveWithBuildChecks); terminal rendering + lifecycle are the caller's
 * job.
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
            return { serversWatcher: new ServersWatcher([]) };
        }

        // Serving both in one process: ignore a generic injected PORT so api and admin don't both
        // grab it — each falls back to its own dedicated port.
        const both = serveApi && serveAdmin;
        const specs: IServerProcessSpec[] = [];

        if (serveApi) {
            const app = this.getApp.execute("api");
            specs.push({
                name: "api",
                spawn: () => runApiServer(app, { watch: false, ignoreGenericPort: both })
            });
        }

        if (serveAdmin) {
            const app = this.getApp.execute("admin");
            specs.push({
                name: "admin",
                spawn: () => runAdminServer(app, { ignoreGenericPort: both })
            });
        }

        // The single-port proxy in front of the two, when the CLI asked for one. Last, so it's the
        // last line of the startup output and the URL worth opening is the one left on screen.
        const devServerSession = getDevServerSession();
        if (devServerSession) {
            specs.push({ name: "proxy", spawn: () => runDevProxy(devServerSession) });
        }

        return { serversWatcher: new ServersWatcher(specs) };
    }
}

export const serverServe = createImplementation({
    abstraction: Serve,
    implementation: ServerServe,
    dependencies: [GetApp, UiService]
});
