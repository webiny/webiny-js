import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TenancyFeature } from "~/features/tenancy/TenancyFeature.js";
import type { Tenant } from "~/types/tenancy.js";
import type { TenancyStorageOperations as ITenancyStorageOperations } from "~/types/tenancy.js";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

describe("TenantContext switches inside a callback", () => {
    let tenantContext: TenantContext.Interface;

    beforeEach(() => {
        const container = new Container();
        TenancyFeature.register(container, new MockTenancyStorageOperations());
        tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(createTenant("root", null));
    });

    it("keeps a withTenant() switch out of code running concurrently with it", async () => {
        const [switched, sibling] = await Promise.all([
            tenantContext.withTenant(createTenant("other", "root"), async tenant => {
                await wait(20);
                return tenant.id;
            }),
            wait(5).then(() => tenantContext.getTenant().id)
        ]);

        expect(switched).toBe("other");
        expect(sibling).toBe("root");
    });

    it("keeps a nested switch in one Promise.all branch out of the other branch", async () => {
        const [nested, sibling] = await tenantContext.withTenant(
            createTenant("sub", "root"),
            async () => {
                return Promise.all([
                    tenantContext.withTenant(createTenant("nested", "root"), async () => {
                        await wait(20);
                        return tenantContext.getTenant().id;
                    }),
                    wait(5).then(() => tenantContext.getTenant().id)
                ]);
            }
        );

        expect(nested).toBe("nested");
        expect(sibling).toBe("sub");
    });

    it("puts the tenant back when the withTenant() callback throws", async () => {
        await expect(
            tenantContext.withTenant(createTenant("other", "root"), async () => {
                throw new Error("Callback failed.");
            })
        ).rejects.toThrow("Callback failed.");

        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("refuses setTenant() inside a withTenant() callback", async () => {
        await expect(
            tenantContext.withTenant(createTenant("sub", "root"), async () => {
                tenantContext.setTenant(createTenant("other", "root"));
            })
        ).rejects.toThrow("TenantContext.setTenant() was called inside a withTenant()");

        expect(tenantContext.getTenant().id).toBe("root");
    });

    it("switches the tenant for each withEachTenant() callback", async () => {
        const ids = await tenantContext.withEachTenant(
            [createTenant("a", "root"), createTenant("b", "root")],
            async () => tenantContext.getTenant().id
        );

        expect(ids).toEqual(["a", "b"]);
        expect(tenantContext.getTenant().id).toBe("root");
    });
});
