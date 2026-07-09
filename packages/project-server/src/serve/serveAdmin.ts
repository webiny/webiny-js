import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { runAdminServer } from "./runAdminServer.js";
import { assertAdminBuilt } from "./builtChecks.js";
import { waitForExit } from "./waitForExit.js";

/**
 * Serve the built admin SPA as static files (production `webiny serve admin`). Blocks until the
 * server process exits. Build the app first (`webiny build admin`).
 */
export async function serveAdmin(app: IAppModel, ui: UiService.Interface): Promise<void> {
    assertAdminBuilt(app);
    await waitForExit(await runAdminServer(app, ui), "admin");
}
