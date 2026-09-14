import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-server";
import { RequestOrigin } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

function headerValue(headers: IncomingMessage["headers"], name: string): string | null {
    const value = headers[name];
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

/**
 * EXTRACT (transport-specific): reconstructs the origin the client actually reached from the
 * forwarding headers of a Node `IncomingMessage`, and puts it in RequestOrigin.
 *
 * The api builds absolute URLs for clients (the file `srcPrefix`, the upload endpoint), and behind a
 * proxy it can't derive them from its own socket: it is listening on a private port that nobody
 * outside can dial, under a path prefix it never sees. The dev proxy sends `x-forwarded-host`,
 * `x-forwarded-proto` and `x-forwarded-prefix` precisely so this can be put back together; nginx and
 * friends send the first two by convention.
 *
 * `host` is the fallback when nothing is forwarding, which is the right answer for a directly
 * exposed api. A configured `<Infra.ApiUrl>` still wins over all of it — this only fills the gap
 * where none is set, so nothing changes for a deployment that pins its origin.
 */
class NodeHttpRequestOriginDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private requestOrigin: RequestOrigin.Interface,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;

        if (headers) {
            const host = headerValue(headers, "x-forwarded-host") ?? headerValue(headers, "host");
            if (host) {
                const proto = headerValue(headers, "x-forwarded-proto") ?? "http";
                const prefix = headerValue(headers, "x-forwarded-prefix") ?? "";
                this.requestOrigin.set(`${proto}://${host}${prefix}`.replace(/\/+$/, ""));
            }
        }

        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpRequestOriginDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpRequestOriginDecoratorImpl,
    dependencies: [RequestOrigin]
});
