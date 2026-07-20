import net from "node:net";

/**
 * Resolve the first free TCP port at or after `start`. Used only for the default port (when no
 * explicit WEBINY_*_PORT / injected PORT is set) so a busy port doesn't block startup. Resolving it
 * once in the parent — rather than retrying inside the child — keeps the port stable across
 * `node --watch` reloads.
 */
export function findFreePort(start: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const server = net.createServer();

        server.once("error", (err: NodeJS.ErrnoException) => {
            server.close();
            if (err.code === "EADDRINUSE") {
                resolve(findFreePort(start + 1));
            } else {
                reject(err);
            }
        });

        server.once("listening", () => {
            server.close(() => resolve(start));
        });

        server.listen(start, "0.0.0.0");
    });
}
