// Translator: converts a Node `IncomingMessage` into Webiny's transport-agnostic IHttpRequest.
// Not an Adapter (which implies interface compatibility).
import type { IncomingMessage } from "node:http";
import type { IHttpRequest } from "@webiny/event-handler-core";

async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", chunk => {
            raw += chunk;
        });
        req.on("end", () => {
            if (!raw) {
                return resolve(undefined);
            }
            const ct = (req.headers["content-type"] || "").toLowerCase();
            if (ct.includes("application/json")) {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve(raw);
                }
            } else {
                resolve(raw);
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
