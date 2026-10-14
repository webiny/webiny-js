import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { RequestContainer, invokeHttpRoute } from "@webiny/event-handler-core";
import type { HttpRouteHandler, IHttpRequest } from "@webiny/event-handler-core";
import { TenancyFeature } from "@webiny/api-core/features/tenancy/TenancyFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import { StableThemeRoute } from "~/rest/StableThemeRoute.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { GetThemeByIdRepository } from "~/features/GetThemeById/index.js";
import { ThemeArtifactService } from "~/features/ThemeArtifacts/index.js";
import type { ActiveThemePointer, Theme } from "~/domain/theme/abstractions.js";

const createTenant = (id: string): Tenant => ({
    id,
    name: id,
    parent: id === "root" ? null : "root",
    isInstalled: true,
    createdOn: new Date().toISOString(),
    description: "",
    settings: {},
    tags: [],
    status: "active",
    savedOn: new Date().toISOString()
});

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    private tenants = new Map(["root", "acme", "globex"].map(id => [id, createTenant(id)]));

    async getTenantById(id: string) {
        return this.tenants.get(id) || null;
    }
    async getTenantsByIds(ids: readonly string[]) {
        return ids.map(id => this.tenants.get(id)!);
    }
    async listTenants() {
        return Array.from(this.tenants.values());
    }
    async createTenant(tenant: Tenant) {
        return tenant;
    }
    async updateTenant(tenant: Tenant) {
        return tenant;
    }
    async deleteTenant() {}
}

const pointer = (entryId: string): ActiveThemePointer => ({
    entryId,
    id: `${entryId}#0001`,
    version: 1,
    activatedOn: new Date().toISOString(),
    activatedBy: { id: "1", displayName: "Admin", type: "admin" }
});

const request = (query: Record<string, string> = {}): IHttpRequest => ({
    method: "GET",
    path: "/_webiny/theme/tokens.css",
    headers: {},
    query,
    pathParameters: { file: "tokens.css" },
    body: null
});

describe("StableThemeRoute - tenancy", () => {
    let tenantContext: TenantContext.Interface;
    let route: HttpRouteHandler.Interface;

    beforeEach(() => {
        const container = new Container();
        container.registerInstance(RequestContainer, container);
        TenancyFeature.register(container, new MockTenancyStorageOperations());

        tenantContext = container.resolve(TenantContext);
        // As the transport leaves it for a request with no `x-tenant` header, which is what a
        // browser's `<link>` sends.
        tenantContext.setTenant(createTenant("root"));

        // Each tenant's active theme, read in whichever tenant is current: root has none.
        const active: Record<string, ActiveThemePointer> = {
            acme: pointer("acme-theme"),
            globex: pointer("globex-theme")
        };
        container.registerInstance(ActiveThemeStore, {
            get: async () => Result.ok(active[tenantContext.getTenant().id] ?? null),
            set: async () => Result.ok(),
            clear: async () => Result.ok()
        });
        container.registerInstance(GetThemeByIdRepository, {
            execute: async (id: string) => Result.ok({ id } as Theme)
        });
        container.registerInstance(ThemeArtifactService, {
            render: (theme: Theme) =>
                Result.ok({
                    contentType: "text/css",
                    body: `/* ${theme.id} */`,
                    immutable: true
                })
        } as unknown as ThemeArtifactService.Interface);

        route = container.resolveImplementation(StableThemeRoute);
    });

    it("serves the tenant named in the query string, which a <link> can carry", async () => {
        const acme = await invokeHttpRoute(route, request({ tenant: "acme" }));
        const globex = await invokeHttpRoute(route, request({ tenant: "globex" }));

        expect(acme.statusCode).toBe(200);
        expect(acme.body).toBe("/* acme-theme#0001 */");
        expect(globex.body).toBe("/* globex-theme#0001 */");
    });

    it("serves the request's own tenant without the parameter, as before", async () => {
        expect((await invokeHttpRoute(route, request())).statusCode).toBe(204);

        tenantContext.setTenant(createTenant("acme"));
        expect((await invokeHttpRoute(route, request())).body).toBe("/* acme-theme#0001 */");
    });

    it("leaves the request's tenant as it was once the response is built", async () => {
        await invokeHttpRoute(route, request({ tenant: "acme" }));

        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("refuses a tenant that does not exist rather than serving root's theme", async () => {
        const response = await invokeHttpRoute(route, request({ tenant: "ghost" }));

        expect(response.statusCode).toBe(404);
        expect(response.body).toContain("ghost");
    });
});
