import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { Tenancy, TenancyStorageOperations } from "~/types";
import { createTenancy } from "~/createTenancy";

describe(`Test "Tenancy" tenants`, () => {
    const { storageOperations } = getStorageOps<TenancyStorageOperations>("tenancy");
    let tenancy: Tenancy;

    let wcpTenantsCount: number;

    beforeEach(async () => {
        wcpTenantsCount = 0;
    });

    beforeAll(async () => {
        tenancy = await createTenancy({
            tenant: null,
            storageOperations,
            incrementWcpTenants: async () => {
                wcpTenantsCount++;
            },
            decrementWcpTenants: async () => {
                wcpTenantsCount--;
            }
        });
    });

    test(`should create/update/list/delete tenants`, async () => {
        const tenant1Data = {
            id: "1",
            name: "Tenant #1",
            tags: [],
            description: "The first sub-tenant",
            parent: "root"
        };

        const tenant2Data = {
            id: "2",
            name: "Tenant #2",
            description: "The second sub-tenant",
            parent: "root",
            status: "pending",
            tags: ["blog"],
            settings: {
                domains: [{ fqdn: "domain.com" }]
            }
        };

        // Install root tenant
        await tenancy.install();

        // After the installation, we should have one tenant recorded.
        expect(wcpTenantsCount).toBe(1);

        // Create first subtenant
        await tenancy.createTenant(tenant1Data);
        const tenants = await tenancy.listTenants({ parent: "root" });
        expect(tenants.length).toBe(1);
        expect(tenants[0]).toEqual({
            ...tenant1Data,
            webinyVersion: process.env.WEBINY_VERSION,
            status: "active",
            settings: { domains: [] },
            createdOn: expect.any(String),
            savedOn: expect.any(String)
        });

        // New tenant added, meaning total tenants count should be 2.
        expect(wcpTenantsCount).toBe(2);

        // Create second subtenant
        await tenancy.createTenant(tenant2Data);
        const tenant2 = await tenancy.getTenantById("2");
        expect(tenant2).toEqual({
            ...tenant2Data,
            webinyVersion: process.env.WEBINY_VERSION,
            status: "pending",
            settings: { domains: [{ fqdn: "domain.com" }] },
            createdOn: expect.any(String),
            savedOn: expect.any(String)
        });

        // Final tenants count should be 3.
        expect(wcpTenantsCount).toBe(3);

        await tenancy.updateTenant("2", { name: "Tenant #2.1", description: "Subtenant" });
        await expect(tenancy.getTenantById("2")).resolves.toEqual({
            ...tenant2Data,
            name: "Tenant #2.1",
            description: "Subtenant",
            webinyVersion: process.env.WEBINY_VERSION,
            createdOn: expect.any(String),
            savedOn: expect.any(String)
        });

        // Retrieve all tenants, regardless of the parent tenant
        const allTenants = await tenancy.listTenants();
        expect(allTenants.length).toBe(3);

        // Delete tenants
        await tenancy.deleteTenant("1");
        await tenancy.deleteTenant("2");

        // With 2 tenants just deleted, the tenants count should fall back to 1.
        expect(wcpTenantsCount).toBe(1);

        await expect(tenancy.listTenants({ parent: "root" })).resolves.toEqual([]);
        await expect(tenancy.getTenantById("1")).resolves.toEqual(undefined);
        await expect(tenancy.getTenantById("2")).resolves.toEqual(undefined);
    });
});
