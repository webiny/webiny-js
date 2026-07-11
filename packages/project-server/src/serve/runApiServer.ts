import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { pickServerRuntimeEnvVariables } from "@webiny/project";
import { findFreePort } from "./findFreePort.js";

interface IRunApiServerOptions {
    /**
     * When true, run the handler under Node's built-in `--watch` scoped to the build dir, so every
     * rebuild reboots the server (dev/watch). When false, run it once (production `serve`).
     */
    watch?: boolean;

    /**
     * When true, ignore a generic `PORT` from the environment and only honour WEBINY_API_PORT / the
     * default. Used when serving both apps at once, where api and admin share one process and must
     * not both bind the same injected `PORT`.
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
 * Returns the spawned child (stdio piped). The caller (e.g. the CLI) owns rendering (prefixing, and
 * for watch the `--watch` output filtering) and lifecycle — same split as the build watcher
 * processes.
 */
export async function runApiServer(
    app: IAppModel,
    options: IRunApiServerOptions = {}
): Promise<ChildProcess> {
    const { watch = false, ignoreGenericPort = false } = options;

    const workspaceApi = app.paths.workspaceFolder;
    const buildDir = workspaceApi.join("graphql", "build");
    const runnerPath = workspaceApi.join(".serve.mjs").toString();
    // Port precedence: explicit WEBINY_API_PORT, then a PORT injected by the environment (e.g.
    // portless, which assigns a random port and expects the server to honour it). Both are honoured
    // strictly (a busy explicit port errors — moving off it would break the proxy). Otherwise fall
    // back to 3002, auto-advancing to the next free port so a busy default doesn't block startup.
    const genericPort = ignoreGenericPort ? undefined : process.env.PORT;
    const explicitPort = process.env.WEBINY_API_PORT || genericPort;
    const port = explicitPort || String(await findFreePort(3002));

    // In watch mode, create the build dir up front so Node's `--watch-path` doesn't ENOENT when the
    // first build hasn't landed yet.
    if (watch) {
        fs.mkdirSync(buildDir.toString(), { recursive: true });
    }

    // Copy the runner verbatim; it reads PORT from env, so no templating is needed.
    const runnerTemplate = path.join(import.meta.dirname, "runners", "apiServerRunner.mjs");
    fs.copyFileSync(runnerTemplate, runnerPath);

    // Hybrid runtime env: the api allowlist (WEBINY_/WCP_PROJECT_ENVIRONMENT/OKTA_/AUTH0_ + DEBUG) —
    // the same app vars the AWS Lambda forwards, no arbitrary leakage — PLUS the system vars a spawned
    // process needs to run (PATH / HOME / NODE_EXTRA_CA_CERTS for portless TLS / temp / locale).
    // `WCP_PROJECT_LICENSE` is absent (not allowlisted), so the handler's WcpLicenseInitializer
    // fetches a fresh license rather than reading the build-time plaintext value.
    const runtimeEnv = pickServerRuntimeEnvVariables();

    // The database is mandatory and must be configured via `<Infra.Sqlite filename="..." />` in
    // webiny.config (which bakes WEBINY_SQL_FILENAME). No implicit default: the child runs from the
    // disposable app workspace, so a cwd-relative fallback would silently put the DB somewhere that's
    // wiped on the next build and lose all data. Fail loudly instead.
    const sqlFilename = process.env.WEBINY_SQL_FILENAME;
    if (!sqlFilename) {
        throw new Error(
            `No database configured for the server flavour. Add ${'`<Infra.Sqlite filename="./.webiny/server.sqlite" />`'} ` +
                `to your webiny.config (or set WEBINY_SQL_FILENAME).`
        );
    }

    const args = watch ? ["--watch-path", buildDir.toString(), runnerPath] : [runnerPath];

    const child = spawn(process.execPath, args, {
        cwd: workspaceApi.toString(),
        // Piped so the caller can prefix/filter + render the output.
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...runtimeEnv, PORT: port, WEBINY_SQL_FILENAME: sqlFilename }
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
