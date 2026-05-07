import { describe, it, expect, afterEach } from "vitest";
import { createServer, RoutePlugin } from "~/index";
import type { NodeServer } from "~/types";

let active: NodeServer | undefined;

const startServer = async (params: Parameters<typeof createServer>[0]): Promise<NodeServer> => {
    const server = createServer({
        // Tests must never install signal handlers — they would persist across
        // test cases and intercept the test runner's own signals.
        gracefulShutdown: false,
        // Quiet logs by default; specific tests can override.
        options: { logger: false },
        port: 0,
        ...params
    });
    await server.listen();
    active = server;
    return server;
};

afterEach(async () => {
    if (active) {
        await active.close();
        active = undefined;
    }
});

describe("handler-node createServer", () => {
    it("starts a server and serves /health by default", async () => {
        const server = await startServer({ plugins: [] });

        const res = await fetch(`${server.address()}/health`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: "ok" });
    });

    it("uses a custom health-check path when configured", async () => {
        const server = await startServer({ plugins: [], healthCheckPath: "/_status" });

        const standard = await fetch(`${server.address()}/health`);
        expect(standard.status).toBe(404);

        const custom = await fetch(`${server.address()}/_status`);
        expect(custom.status).toBe(200);
    });

    it("registers user-supplied RoutePlugins", async () => {
        const server = await startServer({
            plugins: [
                new RoutePlugin(({ onPost }) => {
                    onPost("/echo", async (req, reply) => {
                        return reply.send({ received: req.body });
                    });
                })
            ]
        });

        const res = await fetch(`${server.address()}/echo`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ hello: "world" })
        });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ received: { hello: "world" } });
    });

    it("address() throws before listen()", () => {
        const server = createServer({ plugins: [], gracefulShutdown: false, port: 0 });
        expect(() => server.address()).toThrow(/has not been started/);
    });

    it("close() is idempotent", async () => {
        const server = await startServer({ plugins: [] });

        await server.close();
        await server.close();
        // Mark inactive so afterEach doesn't double-close.
        active = undefined;
    });

    it("close() rejects new connections after shutdown begins", async () => {
        const server = await startServer({ plugins: [] });
        const url = server.address();

        await server.close();
        active = undefined;

        await expect(fetch(`${url}/health`)).rejects.toThrow();
    });
});
