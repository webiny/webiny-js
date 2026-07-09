import { createImplementation } from "@webiny/di";
import { GetApp, Serve, UiService } from "@webiny/project/abstractions/index.js";
import { serveApi } from "./serveApi.js";
import { serveAdmin } from "./serveAdmin.js";
import { serveAll } from "./serveAll.js";

/**
 * Server-flavour Serve implementation: runs built apps as long-running servers (production).
 * Replaces the base DefaultServe (which refuses). api = HTTP handler; admin = static SPA; no app =
 * both. Build checks are applied separately, as a decorator (serveWithBuildChecks).
 */
export class ServerServe implements Serve.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(params: Serve.Params): Promise<void> {
        if (!params.app) {
            await serveAll(this.getApp.execute("api"), this.getApp.execute("admin"), this.ui);
            return;
        }

        if (params.app === "api") {
            await serveApi(this.getApp.execute("api"), this.ui);
            return;
        }

        if (params.app === "admin") {
            await serveAdmin(this.getApp.execute("admin"), this.ui);
            return;
        }

        this.ui.warning(
            `Unknown app %s. Run one of: %s, %s, or %s.`,
            `"${params.app}"`,
            "webiny-server serve",
            "webiny-server serve api",
            "webiny-server serve admin"
        );
    }
}

export const serverServe = createImplementation({
    abstraction: Serve,
    implementation: ServerServe,
    dependencies: [GetApp, UiService]
});
