import { describe, it, expect } from "vitest";
import type { AddressInfo } from "node:net";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { createNodeHandler } from "~/createNodeHandler.js";
import { NodeHttpFeature } from "~/features/NodeHttpFeature.js";

/**
 * Real end-to-end test of the Node HTTP server transport: boots createNodeHandler on an ephemeral
 * port and makes actual HTTP requests. Exercises the full path — NodeHttpEventType matches the
 * IncomingMessage → NodeHttpRouterHandler translates it to IHttpRequest → HttpRouter dispatches to
 * the registered HttpRoute → the IHttpResponse is written back to the socket.
 */
describe("Node HTTP transport (createNodeHandler + NodeHttpRouterHandler)", () => {
    const PingRoute = HttpRoute.createImplementation({
        implementation: class {
            readonly method = "POST";
            readonly path = "/echo";
            async handle(request: IHttpRequest): Promise<IHttpResponse> {
                return {
                    statusCode: 200,
                    headers: { "content-type": "application/json" },
                    body: { echoed: request.body, path: request.path }
                };
            }
        },
        dependencies: []
    });

    const startServer = async () => {
        const server = createNodeHandler({
            root: container => {
                NodeHttpFeature.register(container);
                container.register(PingRoute);
            }
        });
        await new Promise<void>(resolve => server.listen(0, resolve));
        const { port } = server.address() as AddressInfo;
        return { server, port };
    };

    it("routes a matched request to its HttpRoute and returns the response", async () => {
        const { server, port } = await startServer();
        try {
            const res = await fetch(`http://localhost:${port}/echo`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ hello: "world" })
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body).toEqual({ echoed: { hello: "world" }, path: "/echo" });
        } finally {
            server.close();
        }
    });

    it("returns 404 for an unmatched route", async () => {
        const { server, port } = await startServer();
        try {
            const res = await fetch(`http://localhost:${port}/does-not-exist`, { method: "GET" });
            expect(res.status).toBe(404);
        } finally {
            server.close();
        }
    });
});
