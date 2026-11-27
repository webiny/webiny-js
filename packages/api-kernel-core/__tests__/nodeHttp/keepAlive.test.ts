import net from "node:net";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { HttpRouteDefinition, HttpRouteHandler } from "~/index.js";
import type { IHttpResponse } from "~/index.js";
import { createServerHandler } from "~/nodeHttp/createServerHandler.js";
import { NodeHttpFeature } from "~/nodeHttp/features/NodeHttpFeature.js";

class PingRouteImplementation implements HttpRouteHandler.Interface {
    async handle(): Promise<IHttpResponse> {
        return { statusCode: 200, headers: { "content-type": "text/plain" }, body: "pong" };
    }
}

const PingRoute = HttpRouteHandler.createImplementation({
    implementation: PingRouteImplementation,
    dependencies: []
});

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
    while (closers.length > 0) {
        await closers.pop()!();
    }
});

const startServer = async (keepAliveTimeoutMs?: number) => {
    const server = await createServerHandler({
        root: container => {
            NodeHttpFeature.register(container);
            container.registerInstance(HttpRouteDefinition, {
                method: "GET",
                path: "/ping",
                handler: PingRoute
            } as HttpRouteDefinition.Interface);
        },
        keepAliveTimeoutMs
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    closers.push(
        () =>
            new Promise<void>(resolve => {
                server.closeAllConnections();
                server.close(() => resolve());
            })
    );
    const address = server.address();
    return typeof address === "object" && address !== null ? address.port : 0;
};

/*
 * A raw socket, as a proxy holds one: it sends requests down the same connection and sees the
 * moment the server closes it.
 */
const connect = async (port: number) => {
    const socket = net.connect(port, "127.0.0.1");
    await new Promise<void>(resolve => socket.once("connect", () => resolve()));
    const state = { closed: false, received: "" };
    socket.on("data", chunk => (state.received += chunk.toString()));
    socket.on("close", () => (state.closed = true));
    closers.push(async () => {
        socket.destroy();
    });
    const ping = async () => {
        const before = state.received.length;
        socket.write("GET /ping HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: keep-alive\r\n\r\n");
        while (!state.received.slice(before).includes("pong")) {
            if (state.closed) {
                throw new Error("the server closed the connection");
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return state.received.slice(before);
    };
    return { state, ping };
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("keep-alive", () => {
    /*
     * Node closes an idle connection after keepAliveTimeout plus keepAliveTimeoutBuffer (1 s on Node
     * 24), so 6 s by default; the waits below clear that by a margin.
     */
    it("keeps an idle connection open past Node's default, so a proxy can reuse it", async () => {
        const port = await startServer();
        const connection = await connect(port);

        expect(await connection.ping()).toContain("HTTP/1.1 200");
        // A load balancer reuses an idle connection for up to 60 s (AWS ALB).
        await wait(8_000);

        expect(connection.state.closed).toBe(false);
        expect(await connection.ping()).toContain("HTTP/1.1 200");
    }, 20_000);

    it("closes an idle connection after keepAliveTimeoutMs when it is set", async () => {
        const port = await startServer(200);
        const connection = await connect(port);

        expect(await connection.ping()).toContain("HTTP/1.1 200");
        await wait(2_500);

        expect(connection.state.closed).toBe(true);
    });
});
