import net from "node:net";

/** Whether `port` can be bound on `host` right now. */
const isPortFree = (port: number, host: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const server = net.createServer();

        server.once("error", (err: NodeJS.ErrnoException) => {
            server.close();
            if (err.code === "EADDRINUSE") {
                resolve(false);
            } else {
                reject(err);
            }
        });

        server.once("listening", () => {
            server.close(() => resolve(true));
        });

        server.listen(port, host);
    });
};

/**
 * Resolve the first free TCP port at or after `start`. Used only for the default port (when no
 * explicit WEBINY_*_PORT / injected PORT is set) so a busy port doesn't block startup. Resolving it
 * once in the parent — rather than retrying inside the child — keeps the port stable across
 * `node --watch` reloads.
 *
 * A port counts as free only when it is free on every one of `hosts`. Probing the wildcard address
 * alone is not enough for a server that binds 127.0.0.1: on macOS the wildcard bind succeeds even
 * while another process holds the port on 127.0.0.1.
 */
export async function findFreePort(start: number, hosts: string[] = ["0.0.0.0"]): Promise<number> {
    for (let port = start; port <= 65535; port++) {
        let free = true;
        for (const host of hosts) {
            if (!(await isPortFree(port, host))) {
                free = false;
                break;
            }
        }
        if (free) {
            return port;
        }
    }
    throw new Error(`No free port found at or after ${start}.`);
}
