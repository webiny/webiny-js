// Translator: converts between transport-specific format and IHttpRequest/IHttpResponse. Not an Adapter (which implies interface compatibility).
import { IncomingMessage } from "node:http";
import { HttpEventHandler } from "@webiny/event-handler-core";
import type { EventContext, IHttpRequest, NextFunction } from "@webiny/event-handler-core";

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

class NodeHttpTranslatorImpl implements HttpEventHandler.Interface {
    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const url = ctx.event.url || "/";
        const qIdx = url.indexOf("?");

        const request: IHttpRequest = {
            method: ctx.event.method || "GET",
            path: qIdx === -1 ? url : url.slice(0, qIdx),
            headers: ctx.event.headers as Record<string, string>,
            query: parseQuery(url),
            pathParameters: {},
            body: await readBody(ctx.event)
        };

        const httpCtx: EventContext<IHttpRequest> = { event: request, metadata: ctx.metadata };
        return next(httpCtx);
    }
}

export const NodeHttpTranslator = HttpEventHandler.createImplementation({
    implementation: NodeHttpTranslatorImpl,
    dependencies: []
});
