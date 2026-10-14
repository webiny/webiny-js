import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TenancyFeature } from "~/features/tenancy/TenancyFeature.js";
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
        status: "active",
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

describe("TenantContext.withTenant", () => {
    let tenantContext: TenantContext.Interface;

    beforeEach(() => {
        const container = new Container();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(createTenant("root", null));
    });

    it("runs the callback in the given tenant and restores the initial one", async () => {
        const result = await tenantContext.withTenant(createTenant("sub", "root"), async () => {
            return tenantContext.getTenant().id;
        });

        expect(result).toBe("sub");
        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("restores the initial tenant when the callback throws", async () => {
        await expect(
            tenantContext.withTenant(createTenant("sub", "root"), async () => {
                throw new Error("Boom!");
            })
        ).rejects.toThrow("Boom!");

        expect(tenantContext.getTenant().id).toBe("root");
    });
});

/*
 * Work outside an HTTP request (a background task, a scheduled action, a scheduled EventBridge
 * event) starts with no tenant. Restoring that afterwards used to throw, after the callback had
 * already done its work.
 */
describe("TenantContext with no tenant set", () => {
    let tenantContext: TenantContext.Interface;

    beforeEach(() => {
        const container = new Container();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        tenantContext = container.resolve(TenantContext);
    });

    it("withTenant runs the callback and leaves no tenant set", async () => {
        const tenant = createTenant("sub", "root");
        const result = await tenantContext.withTenant(tenant, async () => {
            return tenantContext.getTenant().id;
        });

        expect(result).toBe("sub");
        expect(tenantContext.getTenant()).toBeNull();
    });

    it("withRootTenant runs the callback and leaves no tenant set", async () => {
        const result = await tenantContext.withRootTenant(async () => {
            return tenantContext.getTenant().id;
        });

        expect(result).toBe("root");
        expect(tenantContext.getTenant()).toBeNull();
    });

    it("withEachTenant runs the callback per tenant and leaves no tenant set", async () => {
        const tenants = [createTenant("a", "root"), createTenant("b", "root")];
        const result = await tenantContext.withEachTenant(tenants, async tenant => {
            return tenant.id;
        });

        expect(result).toEqual(["a", "b"]);
        expect(tenantContext.getTenant()).toBeNull();
    });
});
