import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { type Socket } from "node:net";
import { type Duplex } from "node:stream";
import { API_PREFIX } from "./constants.js";

/**
 * Headers that describe a single hop and must not be forwarded to the next one. Copying
 * `transfer-encoding` in particular fights with Node, which sets its own framing based on what we
 * actually write.
 */
const HOP_BY_HOP = [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
];

/**
 * How long a request waits for a target that isn't accepting connections yet, and how often it
 * retries in the meantime.
 *
 * This exists because of watch mode: the api runs under `node --watch` and goes down for a moment on
 * every rebuild. Without the wait, any request landing in that window fails, and since the admin app
 * polls, that's a stream of console errors for something that was never actually broken. The same
 * wait covers the first page load, which usually arrives before the apps have finished booting.
 */
const TARGET_WAIT = 20 * 1000;
const RETRY_INTERVAL = 200;

export interface IDevProxyConfig {
    port: number;
    apiPort: number;
    adminPort: number;
    /** How long a request waits for a target that isn't up yet. Defaults to TARGET_WAIT. */
    targetWait?: number;
}

/** Which server a request belongs to, and what it looks like once it gets there. */
interface ITarget {
    port: number;
    path: string;
    name: string;
    prefix: string | undefined;
}

/**
 * One HTTP port in front of the api and admin servers: `/api/*` goes to the api with the prefix
 * stripped, everything else goes to admin.
 *
 * Prefix routing rather than a list of api paths (`/graphql`, `/files/*`, ...) because routes are
 * registered dynamically and extensions add their own, so any such list would drift. It would also
 * fail in the worst possible way: an api path the proxy hadn't heard of would fall through to admin
 * and come back as `index.html` with a 200.
 *
 * Started by `devProxyRunner`, which `spawnDevProxy` spawns as a child so the proxy is a
 * `ServersWatcher` process like the api and admin servers.
 */
export class DevProxy {
    private readonly server: http.Server;

    /**
     * Upgraded sockets are detached from the server once the handshake completes, so `close()`
     * neither waits for them nor tears them down. Tracked here so shutdown can, otherwise a single
     * open admin websocket is enough to keep the whole command from exiting.
     */
    private readonly upgraded = new Set<Duplex>();

    private readonly port: number;
    private readonly apiPort: number;
    private readonly adminPort: number;
    private readonly targetWait: number;

    private constructor(config: IDevProxyConfig) {
        this.port = config.port;
        this.apiPort = config.apiPort;
        this.adminPort = config.adminPort;
        this.targetWait = config.targetWait ?? TARGET_WAIT;

        this.server = http.createServer((req, res) => this.forward(req, res));

        // Both directions need to stay open indefinitely: server-sent events on the way out, large
        // file uploads on the way in. The defaults would cut either one off mid-flight.
        this.server.requestTimeout = 0;
        this.server.timeout = 0;

        // Websockets: the api's own socket under `/api`, and rsbuild's HMR socket everywhere else.
        // rsbuild's client derives its URL from `location`, so pointing the browser at the proxy is
        // all it takes for HMR to keep working.
        this.server.on("upgrade", (req, socket, head) => this.forwardUpgrade(req, socket, head));

        // A client that disappears mid-request is normal in a browser; it shouldn't take us down.
        this.server.on("clientError", (_error, socket) => socket.destroy());
    }

    static async start(config: IDevProxyConfig): Promise<DevProxy> {
        const proxy = new DevProxy(config);
        await proxy.listen();
        return proxy;
    }

    get url(): string {
        return `http://localhost:${this.port}`;
    }

    close(): Promise<void> {
        return new Promise<void>(resolve => {
            for (const socket of this.upgraded) {
                socket.destroy();
            }
            this.upgraded.clear();
            this.server.closeAllConnections?.();
            this.server.close(() => resolve());
        });
    }

    private listen(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.server.once("error", reject);
            this.server.listen(this.port, () => {
                this.server.removeListener("error", reject);
                resolve();
            });
        });
    }

    private targetFor(url = "/"): ITarget {
        const isApi = url === API_PREFIX || url.startsWith(`${API_PREFIX}/`);

        if (!isApi) {
            return { port: this.adminPort, path: url, name: "admin", prefix: undefined };
        }

        // The api is written to serve `/graphql`, not `/api/graphql`, and is completely unaware it's
        // behind anything. `x-forwarded-prefix` is how it learns what to put back when it builds an
        // absolute URL for a client.
        return {
            port: this.apiPort,
            path: url.slice(API_PREFIX.length) || "/",
            name: "api",
            prefix: API_PREFIX
        };
    }

    private forward(req: IncomingMessage, res: ServerResponse): void {
        const target = this.targetFor(req.url);
        const deadline = Date.now() + this.targetWait;

        const attempt = () => {
            const proxyReq = http.request({
                host: "127.0.0.1",
                port: target.port,
                path: target.path,
                method: req.method,
                headers: { ...stripHopByHop(req.headers), ...forwardedHeaders(req, target.prefix) }
            });

            // Piping only once the socket is connected keeps the incoming request untouched until we
            // know the target is there, which is what makes the retry below safe: nothing has been
            // read off `req`, so replaying costs nothing.
            proxyReq.on("socket", socket => {
                if (socket.connecting) {
                    socket.once("connect", () => req.pipe(proxyReq));
                } else {
                    req.pipe(proxyReq);
                }
            });

            proxyReq.on("response", proxyRes => {
                res.writeHead(
                    proxyRes.statusCode ?? 502,
                    proxyRes.statusMessage,
                    stripHopByHop(proxyRes.headers)
                );

                // Node holds headers back until the first body write, which is fatal for server-sent
                // events: the upstream flushes its headers and then says nothing until it has an
                // event, so without this the client's request stays unresolved that whole time.
                res.flushHeaders();

                // Straight pipe from there, no buffering, for the same reason.
                proxyRes.pipe(res);
            });

            proxyReq.on("error", (error: NodeJS.ErrnoException) => {
                const starting = error.code === "ECONNREFUSED" || error.code === "ECONNRESET";
                if (starting && Date.now() < deadline && !res.headersSent) {
                    setTimeout(attempt, RETRY_INTERVAL);
                    return;
                }

                if (res.headersSent) {
                    res.destroy();
                    return;
                }

                res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
                res.end(`Webiny dev proxy: the ${target.name} server is not responding.\n`);
            });
        };

        attempt();
    }

    private forwardUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
        // Node types the upgrade socket as a bare Duplex; on a TCP server it is always a net.Socket,
        // and the hops below want its Nagle control.
        const clientSocket = socket as Socket;
        const target = this.targetFor(req.url);

        this.track(clientSocket);

        const proxyReq = http.request({
            host: "127.0.0.1",
            port: target.port,
            path: target.path,
            method: req.method,
            // An upgrade *is* the `connection`/`upgrade` header pair, so unlike a normal request
            // those have to survive the hop.
            headers: { ...req.headers, ...forwardedHeaders(req, target.prefix) }
        });

        proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
            this.track(proxySocket);

            clientSocket.write(handshake(proxyRes));

            if (proxyHead?.length) {
                proxySocket.unshift(proxyHead);
            }
            if (head?.length) {
                proxySocket.write(head);
            }

            clientSocket.setNoDelay(true);
            proxySocket.setNoDelay(true);
            proxySocket.on("error", () => clientSocket.destroy());
            clientSocket.on("error", () => proxySocket.destroy());

            proxySocket.pipe(clientSocket).pipe(proxySocket);
        });

        // Both sides reconnect on their own, so a failed upgrade is better dropped than answered.
        proxyReq.on("error", () => clientSocket.destroy());
        proxyReq.end();
    }

    private track(socket: Duplex): void {
        this.upgraded.add(socket);
        socket.once("close", () => this.upgraded.delete(socket));
    }
}

/**
 * What the api needs to reconstruct the URL the browser actually used. Existing values win, so a
 * chain like portless → this proxy still reports the outermost origin rather than ours.
 */
function forwardedHeaders(req: IncomingMessage, prefix: string | undefined) {
    const headers: Record<string, string> = {
        "x-forwarded-host": header(req, "x-forwarded-host") ?? req.headers.host ?? "",
        "x-forwarded-proto": header(req, "x-forwarded-proto") ?? "http",
        "x-forwarded-for": header(req, "x-forwarded-for") ?? req.socket.remoteAddress ?? ""
    };

    if (prefix) {
        headers["x-forwarded-prefix"] = header(req, "x-forwarded-prefix") ?? prefix;
    }

    return headers;
}

function header(req: IncomingMessage, name: string): string | undefined {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
}

function stripHopByHop(headers: http.IncomingHttpHeaders) {
    const result: http.IncomingHttpHeaders = {};
    for (const [name, value] of Object.entries(headers)) {
        if (!HOP_BY_HOP.includes(name.toLowerCase())) {
            result[name] = value;
        }
    }
    return result;
}

/** The 101 response, rebuilt verbatim — an upgrade is answered on the raw socket, not through `res`. */
function handshake(res: IncomingMessage): string {
    const lines = [`HTTP/1.1 ${res.statusCode} ${res.statusMessage}`];

    for (const [name, value] of Object.entries(res.headers)) {
        for (const single of Array.isArray(value) ? value : [value]) {
            lines.push(`${name}: ${single}`);
        }
    }

    return `${lines.join("\r\n")}\r\n\r\n`;
}
