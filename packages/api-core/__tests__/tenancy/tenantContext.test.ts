import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TenancyFeature } from "~/features/tenancy/TenancyFeature.js";
import {
    TenantAlreadySetError,
    TenantIsDisabledError,
    TenantScopesUnavailableError
} from "~/features/tenancy/TenantContext/errors.js";
import { SingleContainerTenantScopes } from "~/features/tenancy/TenantScopes/SingleContainerTenantScopes.js";
import { TenantScopes } from "~/features/tenancy/TenantScopes/abstractions.js";
import { RequestContainer } from "@webiny/api-kernel-core";
import { NoTenantScopesError } from "~/features/tenancy/TenantScopes/errors.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "~/types/tenancy.js";

const createTenant = (id: string, parent: string | null): Tenant => {
    return {
        id,
        name: id,
        parent,
        isInstalled: true,
        createdOn: new Date().toISOString(),
        description: "",
        settings: {},
        tags: [],
        status: "enabled",
        savedOn: new Date().toISOString()
    };
};

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    private tenants = new Map<string, Tenant>([["root", createTenant("root", null)]]);

    async getTenantById(id: string): Promise<Tenant | null> {
        return this.tenants.get(id) || null;
    }

    async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
        return ids.map(id => this.tenants.get(id)!);
    }

    async listTenants(): Promise<Tenant[]> {
        return Array.from(this.tenants.values());
    }

    async createTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async updateTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async deleteTenant(id: string): Promise<void> {
        this.tenants.delete(id);
    }
}

describe("TenantContext", () => {
    let tenantContext: TenantContext.Interface;

    beforeEach(() => {
        const container = new Container();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        tenantContext = container.resolve(TenantContext);
    });

    it("has no tenant until one is set", () => {
        expect(tenantContext.getTenant()).toBeNull();
    });

    it("sets the tenant once, and refreshes its record for the same id", () => {
        tenantContext.setTenant(createTenant("root", null));
        tenantContext.setTenant({ ...createTenant("root", null), name: "Renamed root" });

        expect(tenantContext.getTenant().name).toBe("Renamed root");
    });

    it("refuses another tenant once one is set", () => {
        tenantContext.setTenant(createTenant("root", null));

        expect(() => tenantContext.setTenant(createTenant("sub", "root"))).toThrow(
            TenantAlreadySetError
        );
        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("refuses a disabled tenant", () => {
        const disabled: Tenant = { ...createTenant("sub", "root"), status: "disabled" };

        expect(() => tenantContext.setTenant(disabled)).toThrow(TenantIsDisabledError);
    });
});

/*
 * A container that holds the whole API for one tenant, as the test harnesses without tenant scopes
 * build it: its only scope is itself.
 */
describe("TenantScopes of a single container", () => {
    let container: Container;
    let tenantScopes: TenantScopes.Interface;

    beforeEach(() => {
        container = new Container();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        container.resolve(TenantContext).setTenant(createTenant("root", null));
        container.registerInstance(RequestContainer, container);
        container.register(SingleContainerTenantScopes).inSingletonScope();
        tenantScopes = container.resolve(TenantScopes);
    });

    it("runs the container's own tenant in the container", async () => {
        const result = await tenantScopes.withRootTenant(async scope => {
            return {
                tenant: scope.tenant.id,
                resolved: scope.resolve(TenantContext) === container.resolve(TenantContext)
            };
        });

        expect(result).toEqual({ tenant: "root", resolved: true });
    });

    it("refuses another tenant", async () => {
        await expect(
            tenantScopes.withTenant(createTenant("sub", "root"), async () => "ran")
        ).rejects.toBeInstanceOf(NoTenantScopesError);
    });
});

/*
 * The deprecated `TenantContext.with*` methods in a container that holds the whole API for one
 * tenant: they route through its `SingleContainerTenantScopes`.
 */
describe("Deprecated TenantContext.with* methods of a single container", () => {
    let container: Container;
    let tenantContext: TenantContext.Interface;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(RequestContainer, container);
        container.register(SingleContainerTenantScopes).inSingletonScope();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(createTenant("root", null));
    });

    it("runs the container's own tenant in the container", async () => {
        const viaRoot = await tenantContext.withRootTenant((tenant, scope) => {
            return { tenant: tenant.id, resolved: scope.resolve(TenantContext) === tenantContext };
        });
        const viaTenant = await tenantContext.withTenant(
            createTenant("root", null),
            async tenant => tenant.id
        );
        const viaEach = await tenantContext.withEachTenant(
            [createTenant("root", null)],
            async tenant => tenant.id
        );

        expect({ viaRoot, viaTenant, viaEach }).toEqual({
            viaRoot: { tenant: "root", resolved: true },
            viaTenant: "root",
            viaEach: ["root"]
        });
    });

    it("refuses another tenant", async () => {
        await expect(
            tenantContext.withTenant(createTenant("sub", "root"), async () => "ran")
        ).rejects.toBeInstanceOf(NoTenantScopesError);
        await expect(
            tenantContext.withEachTenant([createTenant("sub", "root")], async () => "ran")
        ).rejects.toBeInstanceOf(NoTenantScopesError);
    });

    it("throws when its container has no TenantScopes", async () => {
        const bare = new Container();
        TenancyFeature.register(bare, new MockTenancyStorageOperations());
        const context = bare.resolve(TenantContext);
        context.setTenant(createTenant("root", null));

        await expect(context.withRootTenant(() => "ran")).rejects.toBeInstanceOf(
            TenantScopesUnavailableError
        );
    });
});
