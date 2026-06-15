import { Transform } from "node:stream";

export function createPrefixer(prefix: string) {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
            const str = chunk.toString();
            const lines = str.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() !== "") {
                    this.push(`${prefix}: ${lines[i]}\n`);
                }
            }
            callback();
        }
    });
}
