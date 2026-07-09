import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { runAdminServer } from "./runAdminServer.js";
import { waitForExit } from "./waitForExit.js";

/**
 * Serve the built admin SPA as static files (production `webiny serve admin`). Blocks until the
 * server process exits. The build is assumed to exist (asserted by the Serve build-check decorator).
 */
export async function serveAdmin(app: IAppModel, ui: UiService.Interface): Promise<void> {
    await waitForExit(await runAdminServer(app, ui), "admin");
}
