import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { runApiServer } from "./runApiServer.js";
import { runAdminServer } from "./runAdminServer.js";
import { assertApiBuilt, assertAdminBuilt } from "./builtChecks.js";
import { waitForExit } from "./waitForExit.js";

/**
 * Serve both the api handler and the admin SPA at once (production `webiny serve`). Both run as
 * separate child processes on their own ports; blocks until either exits (a crash of one surfaces so
 * a supervisor can restart the whole process). Build both apps first (`webiny build`).
 */
export async function serveAll(
    apiApp: IAppModel,
    adminApp: IAppModel,
    ui: UiService.Interface
): Promise<void> {
    // Validate both builds up front so we don't start one server only to fail on the other.
    assertApiBuilt(apiApp);
    assertAdminBuilt(adminApp);

    // Ignore a generic injected PORT here: api and admin run in this one process and must land on
    // their own dedicated ports rather than both grabbing the same PORT.
    const apiChild = await runApiServer(apiApp, ui, { watch: false, ignoreGenericPort: true });
    const adminChild = await runAdminServer(adminApp, ui, { ignoreGenericPort: true });

    await Promise.all([waitForExit(apiChild, "api"), waitForExit(adminChild, "admin")]);
}
