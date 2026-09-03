import { Transform } from "node:stream";

const COLORS = [
    "#00CC00",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3366CC",
    "#33CC00",
    "#33CC99",
    "#6600CC",
    "#66CC00",
    "#9900CC",
    "#99CC00",
    "#CC0000",
    "#CC0066",
    "#CC3300",
    "#CC6600",
    "#CCCC00",
    "#FF0000",
    "#FF3300",
    "#FF6600",
    "#FF9900",
    "#FFCC00"
];

/**
 * Deterministically map a string (package/app name) to one of the palette colors, so the same name
 * always gets the same prefix color across runs.
 */
export function colorForString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

// SGR escape sequences, stripped before matching text so a colorized URL still parses. Assembled with
// `fromCharCode` so the source holds no literal control character.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

// The admin dev server (rsbuild) announces itself as `Local:  http://localhost:3001`. Anchored on the
// `Local:` label so the loopback URL wins over the `Network:` one printed right after it.
const DEV_SERVER_URL = /\bLocal:\s+(https?:\/\/\S+)/;

// ...and reports a finished compile as `ready   built in 3.54s`. That lands seconds after the URL —
// binding the port comes first, building the app second — so it, not the URL, is what "done starting"
// means for the admin app.
const DEV_SERVER_READY = /\bready\b.*\bbuilt in\b/i;

export function stripAnsi(value: string) {
    return value.replace(ANSI, "");
}

export interface ICreatePrefixerOptions {
    /**
     * Called with the dev server URL the first time the stream announces one, so the caller can report
     * where an app came up without having to predict its port.
     */
    onUrl?: (url: string) => void;

    /** Called when the stream reports that it finished starting. Fires again on later rebuilds. */
    onReady?: () => void;
}

/**
 * Line-oriented Transform that prepends `<prefix>: ` to every non-empty output line — used to label
 * interleaved output from multiple child processes (watch build processes, serve api/admin servers).
 *
 * Partial lines are held back until their newline arrives: child output lands in arbitrary chunks, and
 * prefixing each chunk as if it were a whole line breaks single log lines into several prefixed ones.
 */
export function createPrefixer(prefix: string, options: ICreatePrefixerOptions = {}) {
    const { onUrl, onReady } = options;
    let buffer = "";

    return new Transform({
        transform(chunk, _encoding, callback) {
            buffer += chunk.toString();
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                if (onUrl || onReady) {
                    const plain = stripAnsi(line);

                    const url = plain.match(DEV_SERVER_URL);
                    if (url) {
                        onUrl?.(url[1]);
                    } else if (DEV_SERVER_READY.test(plain)) {
                        onReady?.();
                    }
                }

                this.push(`${prefix}: ${line}\n`);
            }

            callback();
        },
        flush(callback) {
            if (buffer.trim()) {
                this.push(`${prefix}: ${buffer}\n`);
            }
            buffer = "";
            callback();
        }
    });
}
