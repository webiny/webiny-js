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

/**
 * Line-oriented Transform that prepends `<prefix>: ` to every non-empty output line — used to label
 * interleaved output from multiple child processes (watch build processes, serve api/admin servers).
 */
export function createPrefixer(prefix: string) {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, _encoding, callback) {
            for (const line of chunk.toString().split(/\r?\n/)) {
                if (line.trim()) {
                    this.push(`${prefix}: ${line}\n`);
                }
            }
            callback();
        }
    });
}
