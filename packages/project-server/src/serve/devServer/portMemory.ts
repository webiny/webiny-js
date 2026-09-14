import fs from "node:fs";
import path from "node:path";
import { PORT_MEMORY_FILE } from "./constants.js";

/**
 * Remembers which port the proxy picked, so a project keeps the same URL across restarts.
 *
 * Without this, the port depends on the order projects happen to start in: stop the project sitting
 * on 3001, restart it, and it might come back on 3002 because another project took 3001 meanwhile.
 * That breaks bookmarks, and it breaks any portless domain mapped to a fixed port.
 *
 * Best-effort throughout. A missing, unreadable or corrupt file just means "no preference" — nothing
 * here is allowed to stop `webiny watch` from starting.
 */
export function readRememberedPort(rootFolder: string): number | null {
    try {
        const contents = fs.readFileSync(path.join(rootFolder, PORT_MEMORY_FILE), "utf-8");
        const port = JSON.parse(contents)?.port;
        return typeof port === "number" && port > 0 && port < 65536 ? port : null;
    } catch {
        return null;
    }
}

export function rememberPort(rootFolder: string, port: number): void {
    try {
        const filePath = path.join(rootFolder, PORT_MEMORY_FILE);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify({ port }, null, 4));
    } catch {
        // Not worth surfacing: the only cost is that the next run may pick a different port.
    }
}
