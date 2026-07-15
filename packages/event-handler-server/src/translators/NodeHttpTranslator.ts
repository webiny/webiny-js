// Translator: converts a Node `IncomingMessage` into Webiny's transport-agnostic IHttpRequest.
// Not an Adapter (which implies interface compatibility).
import type { IncomingMessage } from "node:http";
import type { IHttpRequest } from "@webiny/event-handler-core";

async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        // Collect raw Buffer chunks — do NOT string-concat: `raw += chunk` utf8-decodes each chunk and
        // corrupts binary bodies (e.g. multipart/form-data file uploads), making them unparseable.
        const chunks: Buffer[] = [];
        req.on("data", chunk => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on("end", () => {
            if (chunks.length === 0) {
                return resolve(undefined);
            }
            const buffer = Buffer.concat(chunks);
            const ct = (req.headers["content-type"] || "").toLowerCase();
            if (ct.includes("application/json")) {
                const text = buffer.toString("utf8");
                try {
                    resolve(JSON.parse(text));
                } catch {
                    resolve(text);
                }
            } else if (ct.startsWith("text/") || ct.includes("application/x-www-form-urlencoded")) {
                // Known text bodies → decode as a string.
                resolve(buffer.toString("utf8"));
            } else {
                // Everything else (multipart/form-data file uploads, octet-stream, or an unlabeled raw
                // PUT body like a multipart upload part) is binary — hand routes the raw bytes. Decoding
                // these as utf8 would corrupt the payload.
                resolve(buffer);
            }
        });
        req.on("error", reject);
    });
}

function parseQuery(url: string): Record<string, string> {
    const idx = url.indexOf("?");
    if (idx === -1) {
        return {};
    }
    const result: Record<string, string> = {};
    new URLSearchParams(url.slice(idx + 1)).forEach((v, k) => {
        result[k] = v;
    });
    return result;
}

/**
 * Translate a Node `IncomingMessage` into an `IHttpRequest` (method, path, headers, query, body).
 * Consumed by `NodeHttpRouterHandler` before routing through the shared `HttpRouter`.
 */
export async function nodeHttpRequestFromIncomingMessage(
    req: IncomingMessage
): Promise<IHttpRequest> {
    const url = req.url || "/";
    const qIdx = url.indexOf("?");

    return {
        method: req.method || "GET",
        path: qIdx === -1 ? url : url.slice(0, qIdx),
        headers: req.headers as Record<string, string>,
        query: parseQuery(url),
        pathParameters: {},
        body: await readBody(req)
    };
}
