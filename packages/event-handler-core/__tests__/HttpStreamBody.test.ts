import { describe, it, expect } from "vitest";
import { HttpStreamBody } from "~/features/http/HttpStreamBody.js";

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

async function* stringChunks() {
    yield "a";
    yield "b";
    yield "c";
}

describe("HttpStreamBody", () => {
    describe("is", () => {
        it("should recognise a stream body", () => {
            expect(HttpStreamBody.is(new HttpStreamBody(stringChunks()))).toBe(true);
        });

        it("should not mistake buffered bodies for streams", () => {
            expect(HttpStreamBody.is("text")).toBe(false);
            expect(HttpStreamBody.is({ ok: true })).toBe(false);
            expect(HttpStreamBody.is(Buffer.from("bytes"))).toBe(false);
            expect(HttpStreamBody.is(undefined)).toBe(false);
            expect(HttpStreamBody.is(null)).toBe(false);
        });

        it("should not mistake a bare async iterable for a stream body", () => {
            // The whole point of the marker class: opting into streaming has to be explicit, so an
            // object that merely happens to be async-iterable must stay a buffered body.
            expect(HttpStreamBody.is(stringChunks())).toBe(false);
        });
    });

    describe("collect", () => {
        it("should concatenate string chunks", async () => {
            const body = new HttpStreamBody(stringChunks());
            expect(decode(await body.collect())).toBe("abc");
        });

        it("should concatenate byte chunks", async () => {
            const encoder = new TextEncoder();
            async function* byteChunks() {
                yield encoder.encode("hello ");
                yield encoder.encode("world");
            }

            const body = new HttpStreamBody(byteChunks());
            expect(decode(await body.collect())).toBe("hello world");
        });

        it("should concatenate mixed string and byte chunks", async () => {
            async function* mixed() {
                yield "one:";
                yield new TextEncoder().encode("two");
            }

            const body = new HttpStreamBody(mixed());
            expect(decode(await body.collect())).toBe("one:two");
        });

        it("should return an empty result for an empty stream", async () => {
            async function* empty() {
                // no chunks
            }

            const body = new HttpStreamBody(empty());
            const collected = await body.collect();
            expect(collected.byteLength).toBe(0);
        });

        it("should preserve multi-byte characters split across chunks", async () => {
            // "é" is two UTF-8 bytes. Encoding per chunk and concatenating bytes must not corrupt it,
            // which is why collect() joins bytes rather than decoding chunk by chunk.
            const encoder = new TextEncoder();
            const bytes = encoder.encode("é");
            async function* split() {
                yield bytes.slice(0, 1);
                yield bytes.slice(1);
            }

            const body = new HttpStreamBody(split());
            expect(decode(await body.collect())).toBe("é");
        });

        it("should propagate a producer error", async () => {
            async function* failing() {
                yield "partial";
                throw new Error("producer exploded");
            }

            const body = new HttpStreamBody(failing());
            await expect(body.collect()).rejects.toThrow("producer exploded");
        });
    });

    describe("fromWebStream", () => {
        it("should drain a web ReadableStream", async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(encoder.encode("chunk-1;"));
                    controller.enqueue(encoder.encode("chunk-2"));
                    controller.close();
                }
            });

            const body = HttpStreamBody.fromWebStream(stream);
            expect(decode(await body.collect())).toBe("chunk-1;chunk-2");
        });

        it("should propagate a web stream error", async () => {
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.error(new Error("stream broke"));
                }
            });

            const body = HttpStreamBody.fromWebStream(stream);
            await expect(body.collect()).rejects.toThrow("stream broke");
        });

        it("should yield chunks lazily rather than buffering the whole stream", async () => {
            const encoder = new TextEncoder();
            let pulled = 0;
            const stream = new ReadableStream<Uint8Array>({
                pull(controller) {
                    pulled++;
                    if (pulled > 3) {
                        controller.close();
                        return;
                    }
                    controller.enqueue(encoder.encode(String(pulled)));
                }
            });

            const received: string[] = [];
            for await (const chunk of HttpStreamBody.fromWebStream(stream).source) {
                received.push(decode(chunk as Uint8Array));
                // Each chunk must be observable before the stream finishes; if fromWebStream
                // buffered, we would only get here after all pulls completed.
                expect(received.length).toBeLessThanOrEqual(pulled);
            }

            expect(received).toEqual(["1", "2", "3"]);
        });
    });
});
