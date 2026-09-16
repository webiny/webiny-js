import { type ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";

/**
 * Spawn the single-port dev proxy, so it slots into a `ServersWatcher` next to the api and admin
 * servers and the caller renders all three the same way.
 *
 * Takes no arguments: `reserveDevProxyPorts` already wrote every port it needs into the environment,
 * which is the same way the api and admin servers learn theirs.
 *
 * Unlike `spawnApiServer` / `spawnAdminServer`, the runner isn't copied into an app workspace: the
 * proxy belongs to no app, so it runs from project-server's own build and imports `DevProxy` instead
 * of inlining a server the way theirs have to.
 *
 * Returns the spawned child (stdio piped); the caller owns rendering + lifecycle.
 */
export async function spawnDevProxy(): Promise<ChildProcess> {
    const runnerPath = path.join(import.meta.dirname, "runners", "devProxyRunner.mjs");

    const child = spawn(process.execPath, [runnerPath], {
        // Piped so the caller can prefix + render the output.
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env
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
