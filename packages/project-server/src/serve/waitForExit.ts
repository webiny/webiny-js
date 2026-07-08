import { type ChildProcess } from "node:child_process";

/**
 * Resolve when the given server child process exits cleanly; reject on a non-zero exit or a spawn
 * error. A `null` exit code (process terminated by a signal, e.g. Ctrl+C) is treated as a clean stop.
 */
export function waitForExit(child: ChildProcess, name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        child.on("error", reject);
        child.on("exit", code => {
            if (code === 0 || code === null) {
                resolve();
            } else {
                reject(new Error(`${name} server exited with code ${code}.`));
            }
        });
    });
}
