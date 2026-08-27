import zlib from "node:zlib";
import { promisify } from "node:util";
import { HttpRouter } from "~/features/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Don't compress tiny payloads — the gzip/br framing overhead can make them LARGER, and the CPU cost
// isn't worth it. Matches the threshold used by the old Fastify (@fastify/compress) setup.
const THRESHOLD_BYTES = 1024;

// Case-insensitive header lookup. Header casing isn't guaranteed across transports (Node lowercases
// them, API Gateway payload formats vary), so we can't index by a fixed key.
function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
    if (!headers) {
        return undefined;
    }
    const lower = name.toLowerCase();
    for (const key in headers) {
        if (key.toLowerCase() === lower) {
            return headers[key];
        }
    }
    return undefined;
}

// Serialize the response body to the exact bytes the terminal transport would have written, so the
// size check and the compressed output match what the client receives. Binary bodies (Buffer /
// Uint8Array — e.g. asset delivery images) are returned as `null`: they're already in a compressed
// media format, so gzipping them wastes CPU and can even enlarge them.
function serializeBody(body: any): Buffer | null {
    if (body === undefined || body === null) {
        return null;
    }
    if (typeof body === "string") {
        return Buffer.from(body, "utf8");
    }
    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        return null;
    }
    return Buffer.from(JSON.stringify(body), "utf8");
}

// Pick the best encoding the client accepts. Prefer brotli (better ratio → more headroom under the
// API Gateway response-size limit) and fall back to gzip. Only encodings the client explicitly lists
// are used, so non-browser clients that send `accept-encoding: gzip` still get a body they can read.
function negotiateEncoding(acceptEncoding: string): "br" | "gzip" | null {
    const value = acceptEncoding.toLowerCase();
    if (value.includes("br")) {
        return "br";
    }
    if (value.includes("gzip")) {
        return "gzip";
    }
    return null;
}

function mergeVary(existing: string | undefined): string {
    const parts = new Set(
        (existing || "")
            .split(",")
            .map(part => part.trim().toLowerCase())
            .filter(Boolean)
    );
    parts.add("accept-encoding");
    return [...parts].join(", ");
}

/**
 * Compresses HTTP response bodies with brotli/gzip when the client accepts it.
 *
 * Why: large command-model / entry GraphQL responses were hitting the API Gateway response-size
 * limit and failing. The previous Fastify stack compressed responses (@fastify/compress); that was
 * lost in the move to the event-handler / httpRoute architecture. This restores it transport-
 * agnostically — the compressed body is emitted as a `Buffer`, which both terminal translators
 * already handle (API Gateway base64-encodes it with `isBase64Encoded: true`; the Node server writes
 * the raw bytes), so no translator changes are needed.
 *
 * Registered as the OUTERMOST HTTP decorator so it compresses the fully-formed response (after CORS
 * and other headers are set).
 */
class CompressionDecoratorImpl implements IHttpRouter {
    constructor(private decoratee: IHttpRouter) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        const response = await this.decoratee.route(request);

        // Never double-encode a body a route already compressed itself.
        if (getHeader(response.headers, "content-encoding")) {
            return response;
        }

        const encoding = negotiateEncoding(getHeader(request.headers, "accept-encoding") || "");
        if (!encoding) {
            return response;
        }

        const serialized = serializeBody(response.body);
        if (!serialized || serialized.length < THRESHOLD_BYTES) {
            return response;
        }

        const compressed = encoding === "br" ? await brotli(serialized) : await gzip(serialized);

        return {
            ...response,
            body: compressed,
            headers: {
                ...response.headers,
                "content-encoding": encoding,
                "content-length": String(compressed.length),
                vary: mergeVary(getHeader(response.headers, "vary"))
            }
        };
    }
}

export const CompressionDecorator = HttpRouter.createDecorator({
    decorator: CompressionDecoratorImpl,
    dependencies: []
});
