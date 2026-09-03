import { describe, it, expect } from "vitest";
import { readServerSentEvents } from "../readServerSentEvents.js";

const encoder = new TextEncoder();

function responseFrom(chunks: (string | Uint8Array)[]): Response {
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
            }
            controller.close();
        }
    });

    return { body: stream } as Response;
}

async function collect<T>(response: Response): Promise<T[]> {
    const events: T[] = [];
    for await (const event of readServerSentEvents<T>(response)) {
        events.push(event);
    }
    return events;
}

describe("readServerSentEvents", () => {
    it("should parse one event per record", async () => {
        const events = await collect(
            responseFrom(['data: {"type":"start"}\n\n', 'data: {"type":"done"}\n\n'])
        );

        expect(events).toEqual([{ type: "start" }, { type: "done" }]);
    });

    it("should parse multiple records arriving in a single chunk", async () => {
        const events = await collect(
            responseFrom(['data: {"n":1}\n\ndata: {"n":2}\n\ndata: {"n":3}\n\n'])
        );

        expect(events).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    });

    it("should parse a record split across chunks", async () => {
        const events = await collect(responseFrom(['data: {"ty', 'pe":"partial"}', "\n\n"]));

        expect(events).toEqual([{ type: "partial" }]);
    });

    it("should handle CRLF line endings", async () => {
        const events = await collect(responseFrom(['data: {"ok":true}\r\n\r\n']));

        expect(events).toEqual([{ ok: true }]);
    });

    it("should ignore comments and non-data fields", async () => {
        const events = await collect(
            responseFrom([
                ": heartbeat\n\n",
                'event: message\nid: 7\nretry: 500\ndata: {"kept":true}\n\n'
            ])
        );

        expect(events).toEqual([{ kept: true }]);
    });

    it("should join multi-line data fields", async () => {
        const events = await collect(responseFrom(['data: {"a":1,\ndata: "b":2}\n\n']));

        expect(events).toEqual([{ a: 1, b: 2 }]);
    });

    it("should preserve multi-byte characters split across chunks", async () => {
        const payload = encoder.encode('data: {"text":"café"}\n\n');
        const split = 18;

        const events = await collect(responseFrom([payload.slice(0, split), payload.slice(split)]));

        expect(events).toEqual([{ text: "café" }]);
    });

    it("should drop a trailing record that never terminated", async () => {
        // A truncated stream (server died mid-record) must not yield a half-parsed event.
        const events = await collect(responseFrom(['data: {"complete":true}\n\ndata: {"trunc']));

        expect(events).toEqual([{ complete: true }]);
    });

    it("should yield events as they arrive rather than after the stream closes", async () => {
        let released!: () => void;
        const gate = new Promise<void>(resolve => {
            released = resolve;
        });

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                controller.enqueue(encoder.encode('data: {"n":1}\n\n'));
                await gate;
                controller.enqueue(encoder.encode('data: {"n":2}\n\n'));
                controller.close();
            }
        });

        const iterator = readServerSentEvents<{ n: number }>({ body: stream } as Response);

        // Resolving before the gate opens proves events aren't buffered until close.
        expect((await iterator.next()).value).toEqual({ n: 1 });
        released();
        expect((await iterator.next()).value).toEqual({ n: 2 });
        expect((await iterator.next()).done).toBe(true);
    });

    it("should throw when the response has no body", async () => {
        await expect(collect({ body: null } as Response)).rejects.toThrow(
            "The response carried no readable body."
        );
    });

    it("should propagate a stream error", async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.error(new Error("stream broke"));
            }
        });

        await expect(collect({ body: stream } as Response)).rejects.toThrow("stream broke");
    });
});
