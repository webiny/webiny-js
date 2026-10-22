import http from "node:http";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { createServerHandler } from "~/createServerHandler.js";
import { NodeHttpFeature } from "~/features/NodeHttpFeature.js";

const MAX_BYTES = 1024;

class EchoLengthRouteImplementation implements HttpRouteHandler.Interface {
    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const body: Buffer | undefined = request.body;
        return { statusCode: 200, body: { length: body?.length ?? 0 } };
    }
}

const EchoLengthRoute = HttpRouteHandler.createImplementation({
    implementation: EchoLengthRouteImplementation,
    dependencies: []
});

const definition: HttpRouteDefinition.Interface = {
    name: "echo-length",
    method: "POST",
    path: "/echo",
    handler: EchoLengthRoute
};

interface IReply {
    statusCode: number;
    body: string;
}

function post(port: number, body: Buffer, chunked: boolean): Promise<IReply> {
    return new Promise((resolve, reject) => {
        const headers: Record<string, string | number> = {
            "content-type": "application/octet-stream"
        };
        if (!chunked) {
            headers["content-length"] = body.length;
        }

        const request = http.request(
            { host: "127.0.0.1", port, path: "/echo", method: "POST", headers },
            response => {
                const chunks: Buffer[] = [];
                response.on("data", chunk => chunks.push(chunk));
                response.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    resolve({ statusCode: response.statusCode ?? 0, body: text });
                });
            }
        );
        // The server may close the connection before the whole body is sent.
        request.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code !== "EPIPE") {
                reject(error);
            }
        });

        if (chunked) {
            const half = Math.floor(body.length / 2);
            const firstHalf = body.subarray(0, half);
            const secondHalf = body.subarray(half);
            request.write(firstHalf);
            request.end(secondHalf);
            return;
        }
        request.end(body);
    });
}

describe("Node HTTP server request body", () => {
    let server: http.Server;
    let port: number;

    beforeEach(async () => {
        process.env.WEBINY_API_MAX_REQUEST_BODY_BYTES = String(MAX_BYTES);

        server = await createServerHandler({
            root: container => {
                NodeHttpFeature.register(container);
                container.registerInstance(HttpRouteDefinition, definition);
            }
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        port = typeof address === "object" && address !== null ? address.port : 0;
    });

    afterEach(async () => {
        delete process.env.WEBINY_API_MAX_REQUEST_BODY_BYTES;
        server.closeAllConnections();
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it("accepts a body within the limit", async () => {
        const body = Buffer.alloc(MAX_BYTES);
        const reply = await post(port, body, false);

        expect(reply.statusCode).toBe(200);
        const parsed = JSON.parse(reply.body);
        expect(parsed).toEqual({ length: MAX_BYTES });
    });

    it("refuses a body whose declared length is over the limit", async () => {
        const body = Buffer.alloc(MAX_BYTES + 1);
        const reply = await post(port, body, false);

        expect(reply.statusCode).toBe(413);
        expect(reply.body).toContain("maximum allowed size");
    });

    it("refuses a chunked body once it grows past the limit", async () => {
        const body = Buffer.alloc(MAX_BYTES * 4);
        const reply = await post(port, body, true);

        expect(reply.statusCode).toBe(413);
    });
});
