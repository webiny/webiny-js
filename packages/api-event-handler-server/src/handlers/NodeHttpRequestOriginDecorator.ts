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
 * EXTRACT (transport-specific): works out the address the browser actually used to reach us, and
 * puts it in RequestOrigin for anything that needs to hand an absolute URL back.
 *
 * ## The problem
 *
 * The api has to give clients absolute URLs it does not serve itself: the file `srcPrefix` and the
 * upload endpoint both go into responses the browser then fetches. Behind a proxy the api cannot work
 * those out from its own socket, because the address it was dialled on is not an address anything
 * outside can reach:
 *
 * ```
 *   browser                      dev proxy                       api
 *   ───────                      ─────────                       ───
 *
 *   GET localhost:3001/api/graphql
 *        │
 *        └──────────────────────▶ :3001
 *                                  strips "/api", adds:
 *                                    x-forwarded-proto:  http
 *                                    x-forwarded-host:   localhost:3001
 *                                    x-forwarded-prefix: /api
 *                                    │
 *                                    └────────────────────────▶ :41000
 *                                                               GET /graphql
 *
 *   reachable: localhost:3001/api                       socket says: 127.0.0.1:41000
 * ```
 *
 * Answer with `127.0.0.1:41000` and the browser gets a URL that connects to nothing. It is also the
 * wrong path: the api serves `/graphql` and has never heard of the `/api` the browser typed.
 *
 * ## The reconstruction
 *
 * ```
 *   x-forwarded-proto  ://  x-forwarded-host  +  x-forwarded-prefix
 *        http                 localhost:3001          /api
 *
 *   = "http://localhost:3001/api"  ──▶  RequestOrigin
 * ```
 *
 * The dev proxy sends all three for exactly this. nginx and friends send the first two by convention,
 * and `host` is the fallback when nothing is forwarding at all, which is the right answer for an api
 * exposed directly.
 *
 * ## Who reads it
 *
 * `FileManagerServerConfig` (upload endpoint) and `SettingsInstaller` (file `srcPrefix`), both only
 * as a fallback. A configured `<Infra.ApiUrl>` wins, so a deployment that pins its origin is never
 * second-guessed by a header, which is client input.
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
