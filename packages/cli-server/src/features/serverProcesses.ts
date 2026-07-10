import { type ChildProcess } from "node:child_process";
import chalk from "chalk";
import { colorForString } from "./terminalPrefix.js";

/**
 * Resolve when the given server child process exits cleanly; reject on a non-zero exit or a spawn
 * error. A `null` exit code (terminated by a signal, e.g. Ctrl+C) is treated as a clean stop.
 */
export function waitForExit(name: string, child: ChildProcess): Promise<void> {
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

// Node's built-in `--watch` prints control chatter we don't surface verbatim.
const WATCH_NOISE =
    /^(Restarting|Completed running|Failed running)\b|Waiting for file changes before restarting/;
const LISTENING = /listening on (\S+)/i;

/**
 * Render a watch-mode server child's output: drop Node `--watch` control chatter, turn the runner's
 * "listening on <url>" into a clean first-time/reload line, and prefix everything else with the
 * (colored) process name. Real logs + error stacks pass through, just prefixed.
 */
export function pipeWatchServerOutput(
    name: string,
    child: ChildProcess,
    out: NodeJS.WritableStream
): void {
    const prefix = chalk.hex(colorForString(name))(name);
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
                out.write(
                    started
                        ? `${prefix}: ↻ reloaded\n`
                        : `${prefix}: ✔ listening on ${listening[1]}\n`
                );
                started = true;
                continue;
            }

            out.write(`${prefix}: ${line}\n`);
        }
    };

    child.stdout?.on("data", handle);
    child.stderr?.on("data", handle);
}
