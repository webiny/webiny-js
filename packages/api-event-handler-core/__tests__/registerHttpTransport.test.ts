import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { HttpRouter } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawTenantId as RawTenantIdImpl } from "@webiny/api-core/features/requestContext/RawTenantId.js";
import { RawAssumePermissions as RawAssumePermissionsImpl } from "@webiny/api-core/features/requestContext/RawAssumePermissions.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { registerHttpTransport } from "~/http/registerHttpTransport.js";

/*
 * HttpFeature registered through registerHttpTransport, the way the compositions register their
 * transport, with the tenant and identity loaders replaced by stubs that record the order they run in.
 */
function setup() {
    const steps: string[] = [];
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();
    container.register(RawTenantIdImpl).inSingletonScope();
    container.register(RawAssumePermissionsImpl).inSingletonScope();
    container.registerInstance(RequestTenantLoader, {
        async establish() {
            const assumed = container.resolve(RawAssumePermissions).get();
            steps.push(`tenant (assume-permissions already ${assumed ? "set" : "empty"})`);
        }
    });
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            steps.push("identity");
        }
    });

    registerHttpTransport(container, HttpFeature);
    container.registerInstance(HttpRouter, {
        async route() {
            steps.push("route");
            return { statusCode: 200, body: {} };
        }
    });

    const router = container.resolve(HttpRouter);

    return { container, router, steps };
}

function request(method: string, headers: Record<string, string>): IHttpRequest {
    return { method, path: "/graphql", headers, query: {}, pathParameters: {}, body: {} };
}

describe("registerHttpTransport", () => {
    it("reads assume-permissions, then loads the tenant, then the identity, then routes", async () => {
        const t = setup();
        const headers = {
            "X-Tenant": "acme",
            Authorization: "Bearer the-token",
            "X-Webiny-Assume-Permissions": "role:editor"
        };

        await t.router.route(request("POST", headers));

        expect(t.steps).toEqual(["tenant (assume-permissions already set)", "identity", "route"]);
        expect(t.container.resolve(RawTenantId).get()).toBe("acme");
        expect(t.container.resolve(RawAuthToken).get()).toBe("the-token");
        expect(t.container.resolve(RawAssumePermissions).get()).toEqual({
            type: "role",
            id: "editor"
        });
    });

    it("answers a CORS preflight without loading the tenant or the identity", async () => {
        const t = setup();
        const headers = { origin: "https://admin.example.com" };

        const response = await t.router.route(request("OPTIONS", headers));

        expect(response.statusCode).toBe(204);
        expect(t.steps).toEqual([]);
    });
});
