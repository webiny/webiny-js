import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type UiService } from "@webiny/project/abstractions/index.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { getServerTemplatesFolderPath } from "../utils/getServerTemplatesFolderPath.js";
import { findFreePort } from "./findFreePort.js";

// Cyan "api" label, prepended to every line of the server's output so it reads clearly alongside the
// build watchers (and the admin server when running both).
const PREFIX = "\x1b[36mapi\x1b[0m  ";

// Node's built-in `--watch` prints its own control chatter we don't want to surface verbatim.
const WATCH_NOISE =
    /^(Restarting|Completed running|Failed running)\b|Waiting for file changes before restarting/;
const LISTENING = /listening on (\S+)/i;

/**
 * Pipe the watch child's output through a line filter: drop Node `--watch` control chatter, turn the
 * runner's "listening on <url>" into a clean first-time/reload line, and prefix everything else (real
 * logs and error stacks pass through untouched, just prefixed).
 */
function pipeWatchOutput(child: ChildProcess, port: string): void {
    let started = false;
    let buffer = "";

    const handle = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (!line.trim() || WATCH_NOISE.test(line)) {
                continue;
            }

            const listening = line.match(LISTENING);
            if (listening) {
                process.stdout.write(
                    started
                        ? `${PREFIX}↻ reloaded (:${port})\n`
                        : `${PREFIX}✔ listening on ${listening[1]}\n`
                );
                started = true;
                continue;
            }

            process.stdout.write(`${PREFIX}${line}\n`);
        }
    };

    child.stdout?.on("data", handle);
    child.stderr?.on("data", handle);
}

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
export async function runApiServer(
    app: IAppModel,
    ui: UiService.Interface,
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
    const runnerTemplate = path.join(getServerTemplatesFolderPath(), "apiServerRunner.mjs");
    fs.copyFileSync(runnerTemplate, runnerPath);

    // In serve mode we run in the foreground and let the runner's output through directly. In watch
    // mode we filter/prefix it (see pipeWatchOutput), so we stay quiet here.
    if (!watch) {
        ui.info(`Serving api server on http://localhost:%s ...`, port);
    }

    // `WCP_PROJECT_LICENSE` is a build-time-only var (written plaintext by applyWcpEnvVars for the
    // build-time feature-flag computation). The AWS lambda deliberately never receives it (see
    // project-aws lambdaEnvVariables magicPrefixes), so the runtime fetches + decrypts a fresh,
    // current license. Mirror that: strip it from the api runtime env so getWcpProjectLicense fetches
    // instead of reading the plaintext value.
    const { WCP_PROJECT_LICENSE: _buildTimeLicense, ...runtimeEnv } = process.env;

    // Pin the default sqlite DB to the PROJECT ROOT's `.webiny/` (this CLI's cwd), not the child's
    // cwd. The child runs from the app workspace, which is regenerated on every build — so the
    // template's `process.cwd()`-relative default would put the DB inside the disposable workspace
    // and lose all data on the next watch/build. `<root>/.webiny/` is a sibling of `workspace` and
    // survives rebuilds. Respect an explicit WEBINY_SQL_FILENAME if the user set one.
    const sqlFilename =
        process.env.WEBINY_SQL_FILENAME || path.join(process.cwd(), ".webiny", "server.sqlite");

    const args = watch ? ["--watch-path", buildDir.toString(), runnerPath] : [runnerPath];

    const child = spawn(process.execPath, args, {
        cwd: workspaceApi.toString(),
        // Watch: capture output so we can filter Node's `--watch` chatter and prefix cleanly.
        // Serve: inherit — it's the foreground process, nothing to filter.
        stdio: watch ? ["ignore", "pipe", "pipe"] : "inherit",
        env: { ...runtimeEnv, PORT: port, WEBINY_SQL_FILENAME: sqlFilename }
    });

    if (watch) {
        pipeWatchOutput(child, port);
    }

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
