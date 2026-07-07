import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { getServerTemplatesFolderPath } from "../../utils/getServerTemplatesFolderPath.js";

/**
 * Boot (and keep booting) the built api handler as a live HTTP server, alongside the build watchers.
 *
 * The api workspace compiles to `<workspace>/apps/api/graphql/build/handler.mjs`, which (for the
 * server flavour) exports the Node `http.Server` from `createNodeHandler`. We copy a tiny runner
 * (`apiWatchRunner.mjs`) next to it that imports the handler and calls `.listen(PORT)`, then run it
 * under Node's built-in `--watch` scoped to the build dir — so every rebuild restarts the server in
 * an isolated child process (a server crash never kills the watcher). If the build doesn't exist yet,
 * the runner throws and `--watch` retries once the first build lands.
 */
export function startApiServer(app: IAppModel, ui: UiService.Interface) {
    const workspaceApi = app.paths.workspaceFolder;
    const buildDir = workspaceApi.join("graphql", "build");
    const runnerPath = workspaceApi.join(".serve.mjs").toString();
    // Use a dedicated API port so it never collides with the admin dev server (rsbuild defaults to
    // 3001). Set WEBINY_API_PORT to override.
    const port = process.env.WEBINY_API_PORT || "3000";

    // Create the build dir up front so Node's `--watch-path` (below) doesn't ENOENT when the
    // first build hasn't landed yet.
    fs.mkdirSync(buildDir.toString(), { recursive: true });

    // Copy the runner verbatim; it reads PORT from env, so no templating is needed.
    const runnerTemplate = path.join(getServerTemplatesFolderPath(), "apiWatchRunner.mjs");
    fs.copyFileSync(runnerTemplate, runnerPath);

    ui.info(`Starting api server on http://localhost:%s ...`, port);

    // `WCP_PROJECT_LICENSE` is a build-time-only var (written plaintext by applyWcpEnvVars for the
    // build-time feature-flag computation). The AWS lambda deliberately never receives it (see
    // project-aws lambdaEnvVariables magicPrefixes), so the runtime fetches + decrypts a fresh,
    // current license. Mirror that: strip it from the api runtime env so getWcpProjectLicense fetches
    // instead of reading the plaintext value.
    const { WCP_PROJECT_LICENSE: _buildTimeLicense, ...runtimeEnv } = process.env;

    const child = spawn(process.execPath, ["--watch-path", buildDir.toString(), runnerPath], {
        cwd: workspaceApi.toString(),
        stdio: "inherit",
        env: { ...runtimeEnv, PORT: port }
    });

    const cleanup = () => {
        if (!child.killed) {
            child.kill();
        }
    };
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
        cleanup();
        process.exit(0);
    });

    return child;
}
