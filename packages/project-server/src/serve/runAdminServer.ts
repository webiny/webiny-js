import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { getServerTemplatesFolderPath } from "../utils/getServerTemplatesFolderPath.js";
import { findFreePort } from "./findFreePort.js";

interface IRunAdminServerOptions {
    /**
     * When true, ignore a generic `PORT` from the environment and only honour WEBINY_ADMIN_PORT /
     * the default. Used when serving both apps at once, where api and admin share one process and
     * must not both bind the same injected `PORT`.
     */
    ignoreGenericPort?: boolean;
}

/**
 * Serve the built admin SPA (`<workspace>/apps/admin/build`) as static files.
 *
 * Admin has no SSR — it's a pure static bundle. We copy a tiny static-file runner
 * (`adminServerRunner.mjs`) into the admin workspace and spawn it in an isolated child process. This
 * is a convenience for zero-infra self-hosting; production deploys can just as well point nginx/CDN
 * at the same `build` folder.
 *
 * Returns the spawned child (stdio piped); the CLI owns rendering + lifecycle.
 */
export async function runAdminServer(
    app: IAppModel,
    options: IRunAdminServerOptions = {}
): Promise<ChildProcess> {
    const { ignoreGenericPort = false } = options;

    const workspaceAdmin = app.paths.workspaceFolder;
    const runnerPath = workspaceAdmin.join(".serve.mjs").toString();
    // Port precedence: explicit WEBINY_ADMIN_PORT, then a PORT injected by the environment (e.g.
    // portless, which assigns a random port and expects the server to honour it). Both are honoured
    // strictly. Otherwise fall back to 3001 (the admin dev server port), auto-advancing to the next
    // free port so a busy default doesn't block startup.
    const genericPort = ignoreGenericPort ? undefined : process.env.PORT;
    const explicitPort = process.env.WEBINY_ADMIN_PORT || genericPort;
    const port = explicitPort || String(await findFreePort(3001));

    // Copy the runner verbatim; it reads PORT from env, so no templating is needed.
    const runnerTemplate = path.join(getServerTemplatesFolderPath(), "adminServerRunner.mjs");
    fs.copyFileSync(runnerTemplate, runnerPath);

    const child = spawn(process.execPath, [runnerPath], {
        cwd: workspaceAdmin.toString(),
        // Piped so the CLI can prefix + render the output.
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, PORT: port }
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
