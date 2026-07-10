import { Transform } from "node:stream";

// Node's built-in `--watch` prints control chatter we don't surface verbatim.
const WATCH_NOISE =
    /^(Restarting|Completed running|Failed running)\b|Waiting for file changes before restarting/;
const LISTENING = /listening on (\S+)/i;

/**
 * Line-oriented Transform for a watch-mode server stream: drop Node `--watch` control chatter, turn
 * the runner's "listening on <url>" into a clean first-time/reload line, and prefix everything else
 * with `<prefix>: `. Real logs + error stacks pass through, just prefixed. Applied per stream — the
 * `started` flag lives on the stdout instance (which carries the "listening" line); the stderr
 * instance just drops noise + prefixes.
 */
export function createWatchServerPrefixer(prefix: string) {
    let started = false;
    let buffer = "";

    return new Transform({
        transform(chunk, _encoding, callback) {
            buffer += chunk.toString();
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.trim() || WATCH_NOISE.test(line)) {
                    continue;
                }

                const listening = line.match(LISTENING);
                if (listening) {
                    this.push(
                        started
                            ? `${prefix}: ↻ reloaded\n`
                            : `${prefix}: ✔ listening on ${listening[1]}\n`
                    );
                    started = true;
                    continue;
                }

                this.push(`${prefix}: ${line}\n`);
            }

            callback();
        }
    });
}
