import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { type IDevServerSession } from "./devServer/index.js";

/**
 * Run the single-port dev proxy as a child process, so it slots into a `ServersWatcher` next to the
 * api and admin servers and the caller renders all three the same way.
 *
 * Unlike `runApiServer` / `runAdminServer`, the runner isn't copied into an app workspace: the proxy
 * belongs to no app, and running it from project-server's own build lets it import the implementation
 * instead of inlining it.
 *
 * Returns the spawned child (stdio piped); the caller owns rendering + lifecycle.
 */
export async function runDevProxy(session: IDevServerSession): Promise<ChildProcess> {
    const runnerPath = path.join(import.meta.dirname, "runners", "devProxyRunner.mjs");

    const child = spawn(process.execPath, [runnerPath], {
        // Piped so the caller can prefix + render the output.
        stdio: ["ignore", "pipe", "pipe"],
        env: {
            ...process.env,
            PORT: String(session.port),
            WEBINY_PROXY_API_PORT: String(session.targets.apiPort),
            WEBINY_PROXY_ADMIN_PORT: String(session.targets.adminPort)
        }
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
