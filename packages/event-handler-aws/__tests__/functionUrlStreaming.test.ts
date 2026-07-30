import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpRoute, HttpStreamBody } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { createStreamLambdaHandler } from "~/createStreamLambdaHandler.js";
import { FunctionUrlStreamFeature } from "~/features/FunctionUrlStreamFeature.js";
import type { IRawResponseStream, IResponseStreamMetadata } from "~/streaming/awslambda.js";

const decoder = new TextDecoder();

class FakeResponseStream implements IRawResponseStream {
    chunks: string[] = [];
    ended = false;
    destroyed = false;
    destroyedWith?: Error;
    /** Set to a number to make that many writes report a full buffer. */
    backPressureFor = 0;
    private drainListeners: (() => void)[] = [];

    write(chunk: Uint8Array | string): boolean {
        this.chunks.push(typeof chunk === "string" ? chunk : decoder.decode(chunk));

        if (this.backPressureFor > 0) {
            this.backPressureFor--;
            // Release on the next tick, the way a real socket would.
            setTimeout(() => {
                const listeners = this.drainListeners;
                this.drainListeners = [];
                listeners.forEach(listener => listener());
            }, 0);
            return false;
        }

        return true;
    }

    end(): void {
        this.ended = true;
    }

    destroy(error?: Error): void {
        this.destroyed = true;
        this.destroyedWith = error;
    }

    once(event: string, listener: () => void): unknown {
        if (event === "drain") {
            this.drainListeners.push(listener);
        }
        return this;
    }

    get body(): string {
        return this.chunks.join("");
    }
}

function functionUrlEvent(method = "POST", path = "/stream/test") {
    return {
        version: "2.0",
        routeKey: "$default",
        rawPath: path,
        rawQueryString: "",
        headers: {},
        requestContext: {
            http: { method, path },
            requestId: "req-1",
            stage: "$default"
        },
        isBase64Encoded: false
    };
}

function makeRoute(handle: (request: IHttpRequest) => Promise<IHttpResponse>) {
    class TestRouteImplementation implements HttpRoute.Interface {
        readonly method = "POST";
        readonly path = "/stream/test";
        handle = handle;
    }

    return HttpRoute.createImplementation({
        implementation: TestRouteImplementation,
        dependencies: []
    });
}

function makeHandler(route: ReturnType<typeof HttpRoute.createImplementation>) {
    return createStreamLambdaHandler({
        root: container => {
            FunctionUrlStreamFeature.register(container);
            container.register(route);
        }
    });
}

describe("Lambda Function URL response streaming", () => {
    let prelude: IResponseStreamMetadata | null;
    let streamified: unknown[];

    beforeEach(() => {
        prelude = null;
        streamified = [];

        (globalThis as any).awslambda = {
            streamifyResponse: (handler: unknown) => {
                streamified.push(handler);
                return handler;
            },
            HttpResponseStream: {
                from: (stream: IRawResponseStream, metadata: IResponseStreamMetadata) => {
                    prelude = metadata;
                    return stream;
                }
            }
        };
    });

    afterEach(() => {
        delete (globalThis as any).awslambda;
    });

    it("should mark the handler as streaming at creation time", () => {
        // The runtime inspects the EXPORTED handler for streamifyResponse's mark, so the wrap has to
        // happen when the handler is built — not lazily on first invocation.
        makeHandler(makeRoute(async () => ({ statusCode: 200, body: "ok" })));

        expect(streamified).toHaveLength(1);
    });

    it("should send the status code and headers as the prelude", async () => {
        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 201,
                headers: { "content-type": "text/event-stream" },
                body: "ok"
            }))
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(prelude!.statusCode).toBe(201);
        expect(prelude!.headers!["content-type"]).toBe("text/event-stream");
        // SecureHeadersDecorator runs on this transport too (HttpFeature registers it), so a browser
        // reading the stream cross-origin gets the same CORS treatment as a GraphQL call.
        expect(prelude!.headers!["access-control-allow-origin"]).toBe("*");
    });

    it("should write stream chunks in order and end the stream", async () => {
        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 200,
                headers: { "content-type": "text/event-stream" },
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        yield "data: one\n\n";
                        yield "data: two\n\n";
                    }
                })
            }))
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(stream.chunks).toEqual(["data: one\n\n", "data: two\n\n"]);
        expect(stream.ended).toBe(true);
    });

    it("should write each chunk separately rather than concatenating first", async () => {
        // One write per chunk is what makes delivery incremental; a single joined write would arrive
        // as one lump.
        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 200,
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        yield "a";
                        yield "b";
                        yield "c";
                    }
                })
            }))
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(stream.chunks).toHaveLength(3);
    });

    it("should honour back-pressure", async () => {
        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 200,
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        yield "one";
                        yield "two";
                        yield "three";
                    }
                })
            }))
        );
        const stream = new FakeResponseStream();
        stream.backPressureFor = 2;

        await handler(functionUrlEvent(), stream);

        expect(stream.body).toBe("onetwothree");
        expect(stream.ended).toBe(true);
    });

    it("should stop pulling from the producer once the stream is destroyed", async () => {
        let produced = 0;
        const stream = new FakeResponseStream();

        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 200,
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        while (true) {
                            produced++;
                            // Simulate the client disconnecting after the first chunk.
                            stream.destroy();
                            yield `chunk-${produced}`;
                        }
                    }
                })
            }))
        );

        await handler(functionUrlEvent(), stream);

        expect(produced).toBe(1);
    });

    it("should write a buffered string body", async () => {
        const handler = makeHandler(makeRoute(async () => ({ statusCode: 200, body: "plain" })));
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(stream.body).toBe("plain");
    });

    it("should JSON-stringify a buffered object body", async () => {
        const handler = makeHandler(
            makeRoute(async () => ({ statusCode: 200, body: { ok: true } }))
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(stream.body).toBe(JSON.stringify({ ok: true }));
    });

    it("should send an empty body for null", async () => {
        const handler = makeHandler(makeRoute(async () => ({ statusCode: 204, body: null })));
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(stream.chunks).toHaveLength(0);
        expect(stream.ended).toBe(true);
    });

    it("should hand the translated request to the route", async () => {
        let received: IHttpRequest | null = null;
        const handler = makeHandler(
            makeRoute(async request => {
                received = request;
                return { statusCode: 200, body: "ok" };
            })
        );

        const event = functionUrlEvent();
        event.headers = { "x-tenant": "root" };
        (event as any).cookies = ["wby-id-token=abc"];
        (event as any).body = '{"hello":"world"}';

        await handler(event, new FakeResponseStream());

        expect(received!.method).toBe("POST");
        expect(received!.path).toBe("/stream/test");
        expect(received!.headers["x-tenant"]).toBe("root");
        expect(received!.headers.cookie).toBe("wby-id-token=abc");
        expect(received!.body).toEqual({ hello: "world" });
    });

    it("should answer 404 for an unmatched route", async () => {
        const handler = makeHandler(makeRoute(async () => ({ statusCode: 200, body: "ok" })));
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent("POST", "/stream/nope"), stream);

        expect(prelude!.statusCode).toBe(404);
        expect(JSON.parse(stream.body).message).toContain("Route not found");
    });

    it("should answer 500 when the route throws before streaming", async () => {
        const handler = makeHandler(
            makeRoute(async () => {
                throw new Error("route exploded");
            })
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        expect(prelude!.statusCode).toBe(500);
        expect(JSON.parse(stream.body).message).toBe("Internal server error");
    });

    it("should destroy the stream when the producer fails mid-response", async () => {
        const handler = makeHandler(
            makeRoute(async () => ({
                statusCode: 200,
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        yield "partial";
                        throw new Error("producer exploded");
                    }
                })
            }))
        );
        const stream = new FakeResponseStream();

        await handler(functionUrlEvent(), stream);

        // The prelude already claimed 200, so a truncated body is the only way to signal failure.
        expect(prelude!.statusCode).toBe(200);
        expect(stream.body).toBe("partial");
        expect(stream.destroyed).toBe(true);
        expect(stream.destroyedWith?.message).toBe("producer exploded");
        expect(stream.ended).toBe(false);
    });

    it("should not require the awslambda global to build the handler", () => {
        delete (globalThis as any).awslambda;

        // Importing a bundle that exports both the buffered and the streaming handler must not throw
        // outside the streaming runtime.
        expect(() =>
            makeHandler(makeRoute(async () => ({ statusCode: 200, body: "ok" })))
        ).not.toThrow();
    });
});
