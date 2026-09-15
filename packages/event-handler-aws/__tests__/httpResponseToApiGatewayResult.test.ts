import { describe, it, expect } from "vitest";
import { HttpStreamBody } from "@webiny/event-handler-core";
import { httpResponseToApiGatewayResult } from "~/translators/httpResponseToApiGatewayResult.js";

async function* sseChunks() {
    yield "data: one\n\n";
    yield "data: two\n\n";
}

describe("httpResponseToApiGatewayResult", () => {
    it("should pass a string body through unchanged", async () => {
        const result = await httpResponseToApiGatewayResult({
            statusCode: 200,
            body: "plain"
        });

        expect(result.body).toBe("plain");
        expect(result.isBase64Encoded).toBeUndefined();
    });

    it("should JSON-stringify an object body", async () => {
        const result = await httpResponseToApiGatewayResult({
            statusCode: 200,
            body: { ok: true }
        });

        expect(result.body).toBe(JSON.stringify({ ok: true }));
    });

    it("should base64-encode a Buffer body", async () => {
        const result = await httpResponseToApiGatewayResult({
            statusCode: 200,
            headers: { "content-type": "image/png" },
            body: Buffer.from("PNG")
        });

        expect(result.isBase64Encoded).toBe(true);
        expect(Buffer.from(result.body, "base64").toString()).toBe("PNG");
    });

    it("should send an empty body for null/undefined", async () => {
        await expect(
            httpResponseToApiGatewayResult({ statusCode: 204, body: undefined })
        ).resolves.toMatchObject({ body: "" });

        await expect(
            httpResponseToApiGatewayResult({ statusCode: 204, body: null })
        ).resolves.toMatchObject({ body: "" });
    });

    describe("streaming bodies", () => {
        it("should drain an SSE stream into a text body", async () => {
            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                headers: { "content-type": "text/event-stream" },
                body: new HttpStreamBody(sseChunks())
            });

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe("data: one\n\ndata: two\n\n");
            // Text must NOT be base64'd — a client reading the buffered response expects the same
            // bytes it would have received incrementally.
            expect(result.isBase64Encoded).toBeUndefined();
        });

        it("should drain a JSON stream into a text body", async () => {
            async function* jsonChunks() {
                yield '{"a"';
                yield ":1}";
            }

            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: new HttpStreamBody(jsonChunks())
            });

            expect(result.body).toBe('{"a":1}');
        });

        it("should match the content-type header regardless of casing", async () => {
            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                headers: { "CONTENT-TYPE": "text/event-stream; charset=utf-8" },
                body: new HttpStreamBody(sseChunks())
            });

            expect(result.body).toBe("data: one\n\ndata: two\n\n");
            expect(result.isBase64Encoded).toBeUndefined();
        });

        it("should base64-encode a binary stream", async () => {
            async function* binaryChunks() {
                yield new Uint8Array([0x89, 0x50]);
                yield new Uint8Array([0x4e, 0x47]);
            }

            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                headers: { "content-type": "application/octet-stream" },
                body: new HttpStreamBody(binaryChunks())
            });

            expect(result.isBase64Encoded).toBe(true);
            expect([...Buffer.from(result.body, "base64")]).toEqual([0x89, 0x50, 0x4e, 0x47]);
        });

        it("should base64-encode a stream with no content type", async () => {
            // No content-type means we cannot claim it is text, so the safe choice is binary —
            // decoding arbitrary bytes as utf8 would corrupt them.
            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                body: new HttpStreamBody(sseChunks())
            });

            expect(result.isBase64Encoded).toBe(true);
            expect(Buffer.from(result.body, "base64").toString()).toBe(
                "data: one\n\ndata: two\n\n"
            );
        });

        it("should preserve the response headers", async () => {
            const result = await httpResponseToApiGatewayResult({
                statusCode: 200,
                headers: { "content-type": "text/event-stream", "x-custom": "kept" },
                body: new HttpStreamBody(sseChunks())
            });

            expect(result.headers).toEqual({
                "content-type": "text/event-stream",
                "x-custom": "kept"
            });
        });

        it("should propagate a producer error", async () => {
            async function* failing() {
                yield "data: partial\n\n";
                throw new Error("producer exploded");
            }

            await expect(
                httpResponseToApiGatewayResult({
                    statusCode: 200,
                    headers: { "content-type": "text/event-stream" },
                    body: new HttpStreamBody(failing())
                })
            ).rejects.toThrow("producer exploded");
        });
    });
});
