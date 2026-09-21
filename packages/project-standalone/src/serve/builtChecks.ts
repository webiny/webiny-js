import { type IAppModel } from "@webiny/project/abstractions/models/index.js";

/**
 * Ensure the api app has a built HTTP handler before we try to serve it. Deploy/WCP builds emit
 * `_handler.mjs` (+ a telemetry wrapper at `handler.mjs`); plain builds emit `handler.mjs`.
 */
export function assertApiBuilt(app: IAppModel): void {
    const buildDir = app.paths.workspaceFolder.join("graphql", "build");
    const built =
        buildDir.join("handler.mjs").existsSync() || buildDir.join("_handler.mjs").existsSync();
    if (!built) {
        throw new Error(
            `The "api" app is not built yet. Run "webiny build api" first, then retry.`
        );
    }
}

/**
 * Ensure the admin SPA has been built (an `index.html` at the build root) before serving it.
 */
export function assertAdminBuilt(app: IAppModel): void {
    const built = app.paths.workspaceFolder.join("build", "index.html").existsSync();
    if (!built) {
        throw new Error(
            `The "admin" app is not built yet. Run "webiny build admin" first, then retry.`
        );
    }
}
