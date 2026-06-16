import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import { WebSocket } from "ws";
import { NodeWsAdapterImpl } from "~/adapter/NodeWsAdapter.js";

/* Helper: create an HTTP server, start it on a random port, return address. */
function listenOnRandomPort(server: HttpServer): Promise<number> {
    return new Promise((resolve, reject) => {
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                reject(new Error("Unexpected server address"));
                return;
            }
            resolve(address.port);
        });
    });
}

/* Helper: create a WS client and wait for it to be open. */
function connectClient(port: number): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(`ws://127.0.0.1:${port}`);
        client.once("open", () => resolve(client));
        client.once("error", reject);
    });
}

describe("NodeWsAdapter", () => {
    let httpServer: HttpServer;
    let adapter: NodeWsAdapterImpl;
    let port: number;

    beforeEach(async () => {
        httpServer = createServer();
        adapter = new NodeWsAdapterImpl();
        port = await listenOnRandomPort(httpServer);
        adapter.start(httpServer);
    });

    afterEach(async () => {
        await adapter.stop();
        await new Promise<void>((resolve, reject) => {
            httpServer.close(err => (err ? reject(err) : resolve()));
        });
    });

    it("should fire onConnection when a client connects", async () => {
        const connectionPromise = new Promise<void>(resolve => {
            adapter.onConnection(() => resolve());
        });

        const client = await connectClient(port);
        await connectionPromise;
        client.close();
    });

    it("should fire onMessage when a client sends data", async () => {
        const messagePromise = new Promise<Buffer>(resolve => {
            adapter.onConnection(socket => {
                adapter.onMessage(socket, data => resolve(data));
            });
        });

        const client = await connectClient(port);
        client.send("hello");

        const received = await messagePromise;
        expect(received.toString()).toBe("hello");
        client.close();
    });

    it("should deliver data to client via send()", async () => {
        /* The server will send as soon as the connection is established.
           We need the client message listener attached before the send fires,
           so we connect first, set up the listener, then trigger the send
           by signalling the server via a "ready" message. */
        adapter.onConnection(async socket => {
            /* Wait for the client to say it is ready before sending. */
            await new Promise<void>(resolve => {
                adapter.onMessage(socket, () => resolve());
            });
            await adapter.send(socket, "from server");
        });

        const client = await connectClient(port);

        /* Attach the message listener before signalling readiness. */
        const clientReceived = new Promise<string>(resolve => {
            client.once("message", data => resolve(data.toString()));
        });

        /* Signal the server to send. */
        client.send("ready");

        expect(await clientReceived).toBe("from server");
        client.close();
    });

    it("should disconnect the client via close()", async () => {
        /* Register handler before connecting so the close fires after connect. */
        adapter.onConnection(socket => {
            adapter.close(socket, 1000, "bye");
        });

        const client = await connectClient(port);
        const code = await new Promise<number>(resolve => {
            client.once("close", closeCode => resolve(closeCode));
        });

        expect(code).toBe(1000);
    });
});
