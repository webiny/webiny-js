import { type ChildProcess } from "node:child_process";

// Ctrl+C reaches every process in the terminal's group, but these reach only the CLI itself: `kill`,
// process managers and editor stop buttons send SIGTERM, and a closed session sends SIGHUP.
const STOP_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

/*
 * Stops a server process when the CLI that started it stops.
 *
 * Without this, a server outlives a CLI that was stopped with SIGTERM, keeps its port, and keeps
 * serving whatever it last built. The next `webiny watch` then starts against a server it didn't
 * start. Handling a signal replaces Node's default of exiting, so each handler exits on its own
 * after stopping the child.
 */
export const stopWithParent = (child: ChildProcess): void => {
    const stopChild = () => {
        if (!child.killed) {
            child.kill();
        }
    };

    process.on("exit", stopChild);

    for (const signal of STOP_SIGNALS) {
        process.on(signal, () => {
            stopChild();
            process.exit(0);
        });
    }
};
