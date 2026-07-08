import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { getServerTemplatesFolderPath } from "../utils/getServerTemplatesFolderPath.js";

interface IRunApiServerOptions {
    /**
     * When true, run the handler under Node's built-in `--watch` scoped to the build dir, so every
     * rebuild reboots the server (dev/watch). When false, run it once (production `serve`).
     */
    watch?: boolean;

    /**
     * When true, ignore a generic `PORT` from the environment and only honour WEBINY_API_PORT / the
     * default. Used by the both-at-once path (`serveAll`), where api and admin share one process and
     * must not both bind the same injected `PORT`.
     */
    ignoreGenericPort?: boolean;
}

/**
 * Run the built api handler as a live HTTP server.
 *
 * The api workspace compiles to `<workspace>/apps/api/graphql/build/handler.mjs`, which (for the
 * server flavour) exports the Node `http.Server` from `createNodeHandler`. We copy a tiny runner
 * (`apiServerRunner.mjs`) next to it that imports the handler and calls `.listen(PORT)`, then spawn
 * it in an isolated child process. In watch mode we add `--watch-path <buildDir>` so every rebuild
 * restarts that child (a server crash never kills the watcher).
 *
 * Returns the child process. The caller decides its lifecycle: watch leaves it running alongside the
 * build watchers; serve awaits its exit.
 */
export function runApiServer(
    app: IAppModel,
    ui: UiService.Interface,
    options: IRunApiServerOptions = {}
): ChildProcess {
    const { watch = false, ignoreGenericPort = false } = options;

    const workspaceApi = app.paths.workspaceFolder;
    const buildDir = workspaceApi.join("graphql", "build");
    const runnerPath = workspaceApi.join(".serve.mjs").toString();
    // Port precedence: explicit WEBINY_API_PORT, then a PORT injected by the environment (e.g.
    // portless, which assigns a random port and expects the server to honour it), then a dedicated
    // default that won't collide with the admin dev server (rsbuild defaults to 3001).
    const genericPort = ignoreGenericPort ? undefined : process.env.PORT;
    const port = process.env.WEBINY_API_PORT || genericPort || "3000";

    // In watch mode, create the build dir up front so Node's `--watch-path` doesn't ENOENT when the
    // first build hasn't landed yet.
    if (watch) {
        fs.mkdirSync(buildDir.toString(), { recursive: true });
    }

    // Copy the runner verbatim; it reads PORT from env, so no templating is needed.
    const runnerTemplate = path.join(getServerTemplatesFolderPath(), "apiServerRunner.mjs");
    fs.copyFileSync(runnerTemplate, runnerPath);

    ui.info(`${watch ? "Starting" : "Serving"} api server on http://localhost:%s ...`, port);

    // `WCP_PROJECT_LICENSE` is a build-time-only var (written plaintext by applyWcpEnvVars for the
    // build-time feature-flag computation). The AWS lambda deliberately never receives it (see
    // project-aws lambdaEnvVariables magicPrefixes), so the runtime fetches + decrypts a fresh,
    // current license. Mirror that: strip it from the api runtime env so getWcpProjectLicense fetches
    // instead of reading the plaintext value.
    const { WCP_PROJECT_LICENSE: _buildTimeLicense, ...runtimeEnv } = process.env;

    const args = watch ? ["--watch-path", buildDir.toString(), runnerPath] : [runnerPath];

    const child = spawn(process.execPath, args, {
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
