// Translator: converts a Node `IncomingMessage` into Webiny's transport-agnostic IHttpRequest.
// Not an Adapter (which implies interface compatibility).
import type { IncomingMessage } from "node:http";
import type { IHttpRequest } from "@webiny/event-handler-core";
import { RequestBodyTooLargeError } from "./RequestBodyTooLargeError.js";

/*
 * The whole body is held in memory, so it needs a ceiling: without one, a single large request to
 * any path, even an unauthenticated one, could exhaust the heap. The default leaves room for the
 * SDK's uploads (single files up to 100 MB, multipart parts of 50 MB).
 */
const DEFAULT_MAX_BODY_BYTES = 128 * 1024 * 1024;

function getMaxBodyBytes(): number {
    const configured = Number(process.env.WEBINY_API_MAX_REQUEST_BODY_BYTES);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }
    return DEFAULT_MAX_BODY_BYTES;
}

function decodeBody(req: IncomingMessage, buffer: Buffer): unknown {
    const ct = (req.headers["content-type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
        const text = buffer.toString("utf8");
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }
    if (ct.startsWith("text/") || ct.includes("application/x-www-form-urlencoded")) {
        // Known text bodies → decode as a string.
        return buffer.toString("utf8");
    }
    // Everything else (multipart/form-data file uploads, octet-stream, or an unlabeled raw PUT body
    // like a multipart upload part) is binary — hand routes the raw bytes. Decoding these as utf8
    // would corrupt the payload.
    return buffer;
}

async function readBody(req: IncomingMessage): Promise<any> {
    const maxBytes = getMaxBodyBytes();

    // Refuse a declared oversize body before reading any of it.
    const declaredLength = Number(req.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        throw new RequestBodyTooLargeError(maxBytes);
    }

    return new Promise((resolve, reject) => {
        // Collect raw Buffer chunks — do NOT string-concat: `raw += chunk` utf8-decodes each chunk and
        // corrupts binary bodies (e.g. multipart/form-data file uploads), making them unparseable.
        const chunks: Buffer[] = [];
        let receivedBytes = 0;

        const onData = (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            receivedBytes += buffer.length;
            if (receivedBytes > maxBytes) {
                // A chunked body has no declared length, so it can only be caught while reading.
                req.off("data", onData);
                req.off("end", onEnd);
                chunks.length = 0;
                reject(new RequestBodyTooLargeError(maxBytes));
                return;
            }
            chunks.push(buffer);
        };

        const onEnd = () => {
            if (chunks.length === 0) {
                resolve(undefined);
                return;
            }
            // Throwing inside an event listener would be uncaught, so failures reject instead.
            try {
                const buffer = Buffer.concat(chunks);
                resolve(decodeBody(req, buffer));
            } catch (error) {
                reject(error);
            }
        };

        req.on("data", onData);
        req.on("end", onEnd);
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
