import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { runApiServer } from "./runApiServer.js";
import { assertApiBuilt } from "./builtChecks.js";
import { waitForExit } from "./waitForExit.js";

/**
 * Serve the built api handler as a long-running HTTP server (production `webiny serve api`).
 *
 * Unlike watch, this does not build or reload — it runs the existing build once and blocks until the
 * server process exits. Build the app first (`webiny build api`).
 */
export async function serveApi(app: IAppModel, ui: UiService.Interface): Promise<void> {
    assertApiBuilt(app);
    await waitForExit(runApiServer(app, ui, { watch: false }), "api");
}
