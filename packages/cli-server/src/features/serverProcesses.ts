import { Transform } from "node:stream";
import { type ICreatePrefixerOptions, LINE_BREAK, MAX_LINE_LENGTH } from "./terminalPrefix.js";

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
export function createWatchServerPrefixer(prefix: string, options: ICreatePrefixerOptions = {}) {
    const { onUrl, onReady } = options;
    let started = false;
    let buffer = "";

    return new Transform({
        transform(chunk, _encoding, callback) {
            buffer += chunk.toString();
            const lines = buffer.split(LINE_BREAK);
            buffer = lines.pop() ?? "";

            if (buffer.length > MAX_LINE_LENGTH) {
                lines.push(buffer);
                buffer = "";
            }

            for (const line of lines) {
                if (!line.trim() || WATCH_NOISE.test(line)) {
                    continue;
                }

                const listening = line.match(LISTENING);
                if (listening) {
                    // For a server, listening *is* done starting — both signals come off this one line.
                    if (!started) {
                        onUrl?.(listening[1]);
                    }
                    onReady?.();
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
