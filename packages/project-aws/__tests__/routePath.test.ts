/**
 * The `path` prop on `<Api.Route>` reaches two consumers with different parameter syntax — API
 * Gateway (`{id}`) and the DI `HttpRouter` (`:id`). Both spellings have to be accepted, because
 * projects on 6.4.x wrote whichever their target needed, and a mismatch is invisible: the route
 * deploys, API Gateway forwards the request, and the router 404s it.
 */
import { describe, expect, it } from "vitest";
import { toApiGatewayPath, toRouterPath } from "~/extensions/routePath.js";

describe("toApiGatewayPath", () => {
    it.each([
        ["/orders/:orderId", "/orders/{orderId}"],
        ["/orders/{orderId}", "/orders/{orderId}"],
        ["/tenants/:tenantId/orders/:orderId", "/tenants/{tenantId}/orders/{orderId}"],
        ["/tenants/{tenantId}/orders/:orderId", "/tenants/{tenantId}/orders/{orderId}"],
        ["/my-route", "/my-route"],
        ["/files/*", "/files/*"]
    ])("converts %s to %s", (input, expected) => {
        expect(toApiGatewayPath(input)).toBe(expected);
    });
});

describe("toRouterPath", () => {
    it.each([
        ["/orders/{orderId}", "/orders/:orderId"],
        ["/orders/:orderId", "/orders/:orderId"],
        ["/tenants/{tenantId}/orders/{orderId}", "/tenants/:tenantId/orders/:orderId"],
        ["/tenants/:tenantId/orders/{orderId}", "/tenants/:tenantId/orders/:orderId"],
        ["/my-route", "/my-route"],
        ["/files/*", "/files/*"]
    ])("converts %s to %s", (input, expected) => {
        expect(toRouterPath(input)).toBe(expected);
    });
});

describe("round trip", () => {
    it.each(["/orders/:orderId", "/orders/{orderId}", "/a/:b/c/{d}", "/plain"])(
        "%s converts to one canonical form per consumer",
        path => {
            // Whichever syntax the project wrote, both consumers see their own spelling — and
            // converting an already-converted path is a no-op.
            const gateway = toApiGatewayPath(path);
            const router = toRouterPath(path);

            expect(toApiGatewayPath(gateway)).toBe(gateway);
            expect(toRouterPath(router)).toBe(router);
            expect(toRouterPath(gateway)).toBe(router);
            expect(toApiGatewayPath(router)).toBe(gateway);
        }
    );
});
