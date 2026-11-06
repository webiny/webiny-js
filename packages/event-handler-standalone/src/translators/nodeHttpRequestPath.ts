import type { IncomingMessage } from "node:http";

/**
 * The route path of a Node `IncomingMessage`: its URL without the query string. Shared by the request
 * translator and by anything that must see the same path before routing (e.g. the identity loader
 * deciding whether a request may authenticate with a cookie).
 */
export function nodeHttpRequestPath(req: IncomingMessage): string {
    const url = req.url || "/";
    const qIdx = url.indexOf("?");
    return qIdx === -1 ? url : url.slice(0, qIdx);
}
