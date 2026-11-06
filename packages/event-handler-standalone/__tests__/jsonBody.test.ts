import http from "node:http";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { HttpClientError } from "@webiny/event-handler-core";
import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { createServerHandler } from "~/createServerHandler.js";
import { NodeHttpFeature } from "~/features/NodeHttpFeature.js";

let routeCalls = 0;

class EchoBodyRouteImplementation implements HttpRouteHandler.Interface {
    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        routeCalls++;
        return { statusCode: 200, body: { type: typeof request.body, body: request.body } };
    }
}

const EchoBodyRoute = HttpRouteHandler.createImplementation({
    implementation: EchoBodyRouteImplementation,
    dependencies: []
});

class ClientErrorRouteImplementation implements HttpRouteHandler.Interface {
    async handle(): Promise<IHttpResponse> {
        throw new HttpClientError(415, "UNSUPPORTED", "Nope.");
    }
}

const ClientErrorRoute = HttpRouteHandler.createImplementation({
    implementation: ClientErrorRouteImplementation,
    dependencies: []
});

const echoDefinition: HttpRouteDefinition.Interface = {
    name: "echo-body",
    method: "POST",
    path: "/echo",
    handler: EchoBodyRoute
};

const clientErrorDefinition: HttpRouteDefinition.Interface = {
    name: "client-error",
    method: "POST",
    path: "/client-error",
    handler: ClientErrorRoute
};

interface IReply {
    statusCode: number;
    body: any;
}

function post(port: number, path: string, contentType: string, body: string): Promise<IReply> {
    return new Promise((resolve, reject) => {
        const request = http.request(
            {
                host: "127.0.0.1",
                port,
                path,
                method: "POST",
                headers: { "content-type": contentType }
            },
            response => {
                const chunks: Buffer[] = [];
                response.on("data", chunk => chunks.push(chunk));
                response.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    resolve({ statusCode: response.statusCode ?? 0, body: JSON.parse(text) });
                });
            }
        );
        request.on("error", reject);
        request.end(body);
    });
}

describe("Node HTTP server JSON request body", () => {
    let server: http.Server;
    let port: number;

    beforeEach(async () => {
        routeCalls = 0;
        server = await createServerHandler({
            root: container => {
                NodeHttpFeature.register(container);
                container.registerInstance(HttpRouteDefinition, echoDefinition);
                container.registerInstance(HttpRouteDefinition, clientErrorDefinition);
            }
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        port = typeof address === "object" && address !== null ? address.port : 0;
    });

    afterEach(async () => {
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it("parses an application/json body", async () => {
        const reply = await post(port, "/echo", "application/json; charset=utf-8", '{"a":1}');

        expect(reply.statusCode).toBe(200);
        expect(reply.body).toEqual({ type: "object", body: { a: 1 } });
    });

    it("keeps malformed JSON as the raw string", async () => {
        const reply = await post(port, "/echo", "application/json", "{ not json");

        expect(reply.statusCode).toBe(200);
        expect(reply.body).toEqual({ type: "string", body: "{ not json" });
    });

    it("does not parse a JSON-looking text/plain body", async () => {
        const reply = await post(port, "/echo", "text/plain", '{"a":1}');

        expect(reply.body).toEqual({ type: "string", body: '{"a":1}' });
    });

    it.each([
        ["a __proto__ key", '{"__proto__":{"polluted":true}}'],
        ["a constructor.prototype key", '{"constructor":{"prototype":{"polluted":true}}}']
    ])("refuses a JSON body with %s with a 400, without running the route", async (_, body) => {
        const reply = await post(port, "/echo", "application/json", body);

        expect(reply.statusCode).toBe(400);
        expect(reply.body.code).toBe("REQUEST_BODY_INVALID");
        expect(routeCalls).toBe(0);
        expect(({} as any).polluted).toBeUndefined();
    });

    it("answers a route's HttpClientError with its own status", async () => {
        const reply = await post(port, "/client-error", "application/json", "{}");

        expect(reply.statusCode).toBe(415);
        expect(reply.body).toEqual({ message: "Nope.", code: "UNSUPPORTED", data: null });
    });
});
