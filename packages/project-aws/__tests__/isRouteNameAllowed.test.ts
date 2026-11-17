import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { deriveRouteName } from "@webiny/project/extensions/api/index.js";
import { isRouteNameAllowed } from "~/pulumi/apps/api/isRouteNameAllowed.js";

describe("isRouteNameAllowed", () => {
    it.each([
        ["/e2e/api-route/{id}", "GET"],
        ["/e2e/api-route", "POST"],
        ["/v2/orders/:orderId", "PATCH"],
        ["/orders", "GET"]
    ])("allows the name derived from %s %s", (path, method) => {
        expect(isRouteNameAllowed(deriveRouteName(path, method))).toBe(true);
    });

    it.each(["my-route", "e2e-api-route-get", "v2-orders"])("allows %s", name => {
        expect(isRouteNameAllowed(name)).toBe(true);
    });

    it.each(["myRoute", "my_route", "my route", "-my-route", "my-route-", "my--route", ""])(
        "rejects %j",
        name => {
            expect(isRouteNameAllowed(name)).toBe(false);
        }
    );
});
