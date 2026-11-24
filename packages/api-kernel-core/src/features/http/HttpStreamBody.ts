export type HttpStreamChunk = Uint8Array | string;

export type HttpStreamSource = AsyncIterable<HttpStreamChunk>;

/**
 * Marker for a streaming HTTP response body.
 *
 * `IHttpResponse.body` is untyped, and buffered bodies already carry meaning by their runtime type
 * (string, Buffer/Uint8Array, plain object). Streaming has to be distinguishable from those WITHOUT
 * duck-typing `Symbol.asyncIterator`: a plain object body could accidentally satisfy it, and
 * `ReadableStream`'s async-iterator support (present in Node at runtime) isn't declared in the DOM
 * types. So a route opts into streaming explicitly, by wrapping its source in this class.
 *
 * Transports that can stream (the Node HTTP server; AWS Lambda response streaming via a Function
 * URL) write chunks as they are produced. Transports that cannot (API Gateway buffers the entire
 * Lambda response no matter how it was produced) call {@link collect} and send one buffered body —
 * so the same route still works there, just without incremental delivery.
 */
export class HttpStreamBody {
    constructor(readonly source: HttpStreamSource) {}

    static is(value: unknown): value is HttpStreamBody {
        return value instanceof HttpStreamBody;
    }

    /**
     * Wrap a web `ReadableStream` — what `fetch` and the AI SDK's `toUIMessageStreamResponse()`
     * hand back. The reader is driven explicitly rather than relying on async iteration, because
     * the DOM types don't declare it even though Node implements it.
     */
    static fromWebStream(stream: ReadableStream<Uint8Array>): HttpStreamBody {
        return new HttpStreamBody({
            async *[Symbol.asyncIterator]() {
                const reader = stream.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }
                        if (value !== undefined) {
                            yield value;
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }
        });
    }

    /**
     * Drain the whole stream into a single byte array, for transports that can't stream.
     *
     * Consumes the source — a stream can only be read once, so this must not be combined with
     * writing the same body incrementally.
     */
    async collect(): Promise<Uint8Array> {
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];
        let total = 0;

        for await (const chunk of this.source) {
            const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
            chunks.push(bytes);
            total += bytes.byteLength;
        }

        const result = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.byteLength;
        }

        return result;
    }
}
