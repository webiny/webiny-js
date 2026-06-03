import { IncomingMessage } from "node:http";
import { CloudHandler } from "@cloudi/core";
import type { IHttpRequest, NextFunction } from "@cloudi/core";

async function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", chunk => {
            raw += chunk;
        });
        req.on("end", () => {
            if (!raw) return resolve(undefined);
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
    if (idx === -1) return {};
    const result: Record<string, string> = {};
    new URLSearchParams(url.slice(idx + 1)).forEach((v, k) => {
        result[k] = v;
    });
    return result;
}

class NodeHttpAdapterImpl implements CloudHandler.Interface {
    async execute(event: any, next: NextFunction): Promise<any> {
        if (!(event instanceof IncomingMessage)) return next();

        const url = event.url || "/";
        const qIdx = url.indexOf("?");

        const request: IHttpRequest = {
            method: event.method || "GET",
            path: qIdx === -1 ? url : url.slice(0, qIdx),
            headers: event.headers as Record<string, string>,
            query: parseQuery(url),
            body: await readBody(event)
        };

        return next(request);
    }
}

export const NodeHttpAdapter = CloudHandler.createImplementation({
    implementation: NodeHttpAdapterImpl,
    dependencies: []
});
