import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ResolveIdentityTenantsUseCase } from "@webiny/api-core/exports/api/security.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import TenantAccessImpl from "~/api/features/TenantAccess/TenantAccess.js";

const createAccess = (params: { canManageTenants: boolean; tenants: string[] }) => {
    const container = new Container();
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "user" }),
        getPermission: async () => (params.canManageTenants ? { name: "tm.tenant" } : null)
    } as any);
    container.registerInstance(Tenancy.TenantContext, {
        getTenant: () => ({ id: "acme" })
    } as any);
    container.registerInstance(Tenancy.GetTenantByIdUseCase, {} as any);
    container.registerInstance(ResolveIdentityTenantsUseCase, {
        execute: async () => Result.ok(params.tenants.map(id => ({ id, name: id })))
    } as any);
    container.register(TenantAccessImpl);
    return container.resolve(TenantAccess);
};

describe("Tenant manager: who may list every tenant", () => {
    it("lets a root user with the Tenant Manager permission list tenants", async () => {
        const access = createAccess({ canManageTenants: true, tenants: ["root"] });

        const result = await access.canList();

        expect(result.isOk()).toBe(true);
    });

    it("refuses a sub-tenant user, even with the Tenant Manager permission there", async () => {
        const access = createAccess({ canManageTenants: true, tenants: ["acme"] });

        const result = await access.canList();

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("NOT_AUTHORIZED");
    });

    it("refuses a root user without the Tenant Manager permission", async () => {
        const access = createAccess({ canManageTenants: false, tenants: ["root"] });

        const result = await access.canList();

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("NOT_AUTHORIZED");
    });
});
