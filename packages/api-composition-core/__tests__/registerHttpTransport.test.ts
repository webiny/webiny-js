import { AsyncLocalStorage } from "node:async_hooks";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { Abstraction, Container } from "@webiny/di";
import {
    HttpFeature,
    HttpRouteDispatcher,
    HttpRouter,
    HttpStreamBody
} from "@webiny/api-kernel-core";
import type { IHttpRequest, InputChainRunner, InputHandler } from "@webiny/api-kernel-core";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawTenantId as RawTenantIdImpl } from "@webiny/api-core/features/requestContext/RawTenantId.js";
import { RawAssumePermissions as RawAssumePermissionsImpl } from "@webiny/api-core/features/requestContext/RawAssumePermissions.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { TenantNotFoundError } from "@webiny/api-core/features/requestContext/index.js";
import {
    InputTenantSource,
    TenantScopes
} from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import type { TenantScope } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { registerHttpTransport } from "~/http/registerHttpTransport.js";

const TestHttpInputHandler = new Abstraction<InputHandler.Interface>("TestHttpInputHandler");

const tenant = (id: string): Tenant => ({ id, name: id, status: "enabled" }) as Tenant;

/*
 * HttpFeature registered through registerHttpTransport, the way the compositions register their
 * transport. The tenant loader and the identity loader are stubs that record the order they run in.
 * `TenantScopes` builds a real child container as the tenant's scope, and only the scope has the
 * identity loader: the identity and the routes can only run there.
 */
function setup(params: { loadTenant?: (id: string | null) => Tenant } = {}) {
    const steps: string[] = [];
    const scopeStore = new AsyncLocalStorage<string>();
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();
    container.register(RawTenantIdImpl).inSingletonScope();
    container.register(RawAssumePermissionsImpl).inSingletonScope();
    container.registerInstance(RequestTenantLoader, {
        async establish() {
            const assumed = container.resolve(RawAssumePermissions).get();
            steps.push(`tenant (assume-permissions already ${assumed ? "set" : "empty"})`);
            const id = container.resolve(RawTenantId).get();
            return params.loadTenant ? params.loadTenant(id) : tenant(id ?? "root");
        }
    });

    const scopes: string[] = [];
    let scopeCallbacksRunning = 0;
    container.registerInstance(TenantScopes, {
        async withTenant(target, cb) {
            scopes.push(target.id);
            const scopeContainer = container.createChildContainer();
            scopeContainer.registerInstance(RequestIdentityLoader, {
                async establish() {
                    steps.push(`identity (in ${scopeStore.getStore()})`);
                }
            });
            const scope = {
                tenant: target,
                storage: "default",
                resolve: abstraction => scopeContainer.resolve(abstraction),
                resolveAll: abstraction => scopeContainer.resolveAll(abstraction)
            } as TenantScope.Interface;
            scopeCallbacksRunning++;
            try {
                return await scopeStore.run(`scope:${target.id}`, () => cb(scope));
            } finally {
                scopeCallbacksRunning--;
            }
        }
    } as TenantScopes.Interface);

    let routeResponse = async () => {
        steps.push(`route (in ${scopeStore.getStore()})`);
        return { statusCode: 200, body: {} };
    };

    registerHttpTransport(container, HttpFeature, TestHttpInputHandler);
    container.registerInstance(HttpRouteDispatcher, {
        route: () => routeResponse()
    });

    const router = container.resolve(HttpRouter);

    return {
        container,
        router,
        steps,
        scopes,
        scopeStore,
        isScopeInUse: () => scopeCallbacksRunning > 0,
        setRoute: (route: typeof routeResponse) => {
            routeResponse = route;
        }
    };
}

function request(method: string, headers: Record<string, string>): IHttpRequest {
    return { method, path: "/graphql", headers, query: {}, pathParameters: {}, body: {} };
}

describe("registerHttpTransport", () => {
    beforeEach(() => {
        // ErrorResponseDecorator logs the errors it answers with a 500.
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("reads assume-permissions, then loads the tenant, then the identity, then routes", async () => {
        const t = setup();
        const headers = {
            "X-Tenant": "acme",
            Authorization: "Bearer the-token",
            "X-Webiny-Assume-Permissions": "role:editor"
        };

        await t.router.route(request("POST", headers));

        expect(t.steps).toEqual([
            "tenant (assume-permissions already set)",
            "identity (in scope:acme)",
            "route (in scope:acme)"
        ]);
        expect(t.scopes).toEqual(["acme"]);
        expect(t.container.resolve(RawTenantId).get()).toBe("acme");
        expect(t.container.resolve(RawAuthToken).get()).toBe("the-token");
        expect(t.container.resolve(RawAssumePermissions).get()).toEqual({
            type: "role",
            id: "editor"
        });
    });

    it("answers a CORS preflight without loading the tenant or the identity, or entering a scope", async () => {
        const t = setup();
        const headers = { origin: "https://admin.example.com" };

        const response = await t.router.route(request("OPTIONS", headers));

        expect(response.statusCode).toBe(204);
        expect(t.steps).toEqual([]);
        expect(t.scopes).toEqual([]);
    });

    it("answers an unknown tenant with a 500 and the CORS headers, without entering a scope", async () => {
        const t = setup({
            loadTenant: id => {
                throw new TenantNotFoundError(id!);
            }
        });
        const headers = { "x-tenant": "missing", origin: "https://admin.example.com" };

        const response = await t.router.route(request("POST", headers));

        expect(response.statusCode).toBe(500);
        expect(response.headers).toMatchObject({
            "access-control-allow-origin": "https://admin.example.com",
            vary: "origin"
        });
        expect(t.scopes).toEqual([]);
        expect(t.steps).toEqual(["tenant (assume-permissions already empty)"]);
    });

    it("reads a streamed body in the tenant's scope, and keeps the scope in use until it is read", async () => {
        const t = setup();
        t.setRoute(async () => {
            const store = t.scopeStore;
            return {
                statusCode: 200,
                body: new HttpStreamBody({
                    async *[Symbol.asyncIterator]() {
                        yield `first chunk in ${store.getStore()}`;
                        await new Promise(resolve => setTimeout(resolve, 1));
                        yield `second chunk in ${store.getStore()}`;
                    }
                })
            };
        });

        const response = await t.router.route(request("POST", { "x-tenant": "acme" }));

        // The router returned, outside the scope's callback, but the body hasn't been read yet.
        expect(t.scopeStore.getStore()).toBeUndefined();
        expect(t.isScopeInUse()).toBe(true);

        const chunks: string[] = [];
        for await (const chunk of (response.body as HttpStreamBody).source) {
            chunks.push(String(chunk));
        }

        expect(chunks).toEqual(["first chunk in scope:acme", "second chunk in scope:acme"]);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(t.isScopeInUse()).toBe(false);
    });

    it("leaves the transport's handler chain at request level, and no other chain", async () => {
        const t = setup();
        const sources = t.container.resolveAll(InputTenantSource);
        const chain = (abstraction: Abstraction<any>): InputChainRunner.Request => {
            return { container: t.container, abstraction, input: {} };
        };
        const OtherInputHandler = new Abstraction<InputHandler.Interface>("OtherInputHandler");

        expect(sources.map(source => source.getTenant(chain(TestHttpInputHandler)))).toEqual([
            "tenant-neutral"
        ]);
        expect(sources.map(source => source.getTenant(chain(OtherInputHandler)))).toEqual([
            undefined
        ]);
    });
});
