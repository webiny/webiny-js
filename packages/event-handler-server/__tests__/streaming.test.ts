import { describe, it, expect } from "vitest";
import { HttpRoute, HttpStreamBody } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse, HttpStreamSource } from "@webiny/event-handler-core";
import { createServerHandler } from "~/createServerHandler.js";
import { NodeHttpFeature } from "~/features/NodeHttpFeature.js";

const decoder = new TextDecoder();

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

function makeRoute(response: () => IHttpResponse) {
    class StreamRouteImplementation implements HttpRoute.Interface {
        readonly method = "GET";
        readonly path = "/stream";
        async handle(_req: IHttpRequest): Promise<IHttpResponse> {
            return response();
        }
    }

    return HttpRoute.createImplementation({
        implementation: StreamRouteImplementation,
        dependencies: []
    });
}

function streamResponse(source: HttpStreamSource): IHttpResponse {
    return {
        statusCode: 200,
        headers: { "content-type": "text/event-stream" },
        body: new HttpStreamBody(source)
    };
}

async function startServer(route: ReturnType<typeof HttpRoute.createImplementation>) {
    const server = await createServerHandler({
        root: container => {
            NodeHttpFeature.register(container);
            container.register(route);
        }
    });

    await new Promise<void>(resolve => {
        server.listen(0, () => resolve());
    });

    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;

    return {
        url: `http://127.0.0.1:${port}/stream`,
        close: () =>
            new Promise<void>(resolve => {
                server.closeAllConnections();
                server.close(() => resolve());
            })
    };
}

describe("Node HTTP server streaming", () => {
    it("should deliver chunks incrementally", async () => {
        const firstChunkRead = deferred();

        const route = makeRoute(() =>
            streamResponse({
                async *[Symbol.asyncIterator]() {
                    yield "data: first\n\n";
                    // Blocks until the client has actually received the first chunk. If the
                    // transport buffered the body instead of streaming it, the client's first read
                    // could never complete and this test would time out — which is exactly the
                    // behaviour being asserted.
                    await firstChunkRead.promise;
                    yield "data: second\n\n";
                }
            })
        );

        const server = await startServer(route);

        try {
            // Resolving at all proves the headers were flushed before the body finished: the
            // producer is still parked on `firstChunkRead` at this point.
            const response = await fetch(server.url);
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe("text/event-stream");
            // Streamed responses are chunked — a content-length would mean the body was buffered.
            expect(response.headers.get("content-length")).toBeNull();

            const reader = response.body!.getReader();

            const first = await reader.read();
            expect(decoder.decode(first.value)).toBe("data: first\n\n");

            firstChunkRead.resolve();

            const second = await reader.read();
            expect(decoder.decode(second.value)).toBe("data: second\n\n");

            expect((await reader.read()).done).toBe(true);
        } finally {
            await server.close();
        }
    });

    it("should stream byte chunks", async () => {
        const encoder = new TextEncoder();
        const route = makeRoute(() =>
            streamResponse({
                async *[Symbol.asyncIterator]() {
                    yield encoder.encode("bytes-");
                    yield encoder.encode("through");
                }
            })
        );

        const server = await startServer(route);

        try {
            const response = await fetch(server.url);
            expect(await response.text()).toBe("bytes-through");
        } finally {
            await server.close();
        }
    });

    it("should handle back-pressure without losing or reordering data", async () => {
        // Enough data to fill the socket buffer and force the `drain` path. If back-pressure were
        // mishandled the response would be truncated or the write would stall forever.
        const chunkCount = 2000;
        const chunk = "x".repeat(1024);

        const route = makeRoute(() =>
            streamResponse({
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < chunkCount; i++) {
                        yield `${i}:${chunk}\n`;
                    }
                }
            })
        );

        const server = await startServer(route);

        try {
            const response = await fetch(server.url);
            const text = await response.text();
            const lines = text.split("\n").filter(Boolean);

            expect(lines).toHaveLength(chunkCount);
            expect(lines[0]).toBe(`0:${chunk}`);
            expect(lines[chunkCount - 1]).toBe(`${chunkCount - 1}:${chunk}`);
        } finally {
            await server.close();
        }
    });

    it("should send an empty body for an empty stream", async () => {
        const route = makeRoute(() =>
            streamResponse({
                async *[Symbol.asyncIterator]() {
                    // no chunks
                }
            })
        );

        const server = await startServer(route);

        try {
            const response = await fetch(server.url);
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("");
        } finally {
            await server.close();
        }
    });

    it("should truncate the response when the producer fails mid-stream", async () => {
        const route = makeRoute(() =>
            streamResponse({
                async *[Symbol.asyncIterator]() {
                    yield "data: partial\n\n";
                    throw new Error("producer exploded");
                }
            })
        );

        const server = await startServer(route);

        try {
            const response = await fetch(server.url);
            // The status line already went out as 200 — there is no way to retroactively send a 500,
            // so the client has to learn about the failure from an incomplete body.
            expect(response.status).toBe(200);
            await expect(response.text()).rejects.toThrow();
        } finally {
            await server.close();
        }
    });

    it("should still serve buffered bodies", async () => {
        const route = makeRoute(() => ({
            statusCode: 200,
            headers: { "content-type": "application/json" },
            body: { ok: true }
        }));

        const server = await startServer(route);

        try {
            const response = await fetch(server.url);
            expect(await response.json()).toEqual({ ok: true });
        } finally {
            await server.close();
        }
    });
});
