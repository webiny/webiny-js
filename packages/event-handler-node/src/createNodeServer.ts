import http from "node:http";
import { createHandler } from "@webiny/event-handler-core";
import type { HandlerSetup, IHttpResponse } from "@webiny/event-handler-core";

export interface CreateNodeServerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

export function createNodeServer(options: CreateNodeServerOptions): http.Server {
    const handle = createHandler(options);

    return http.createServer(async (req, res) => {
        try {
            const response = (await handle(req)) as IHttpResponse;
            res.writeHead(response.statusCode, response.headers);
            const { body } = response;
            if (body === undefined || body === null) {
                res.end();
            } else if (typeof body === "string") {
                res.end(body);
            } else {
                res.end(JSON.stringify(body));
            }
        } catch (err) {
            console.error("Unhandled error:", err);
            res.writeHead(500);
            res.end("Internal Server Error");
        }
    });
}
