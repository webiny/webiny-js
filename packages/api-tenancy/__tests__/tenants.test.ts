import { Tenancy } from "~/types";
import { createTenancy } from "~/createTenancy";

describe(`Test "Tenancy" tenants`, () => {
    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    let tenancy: Tenancy = null;

    beforeAll(async () => {
        tenancy = await createTenancy({
            tenant: null,
            storageOperations
        });
    });

    test(`should create/update/list/delete tenants`, async () => {
        await tenancy.createTenant({ id: "1", name: "Tenant #1", parent: "root" });
        const tenants = await tenancy.listTenants({ parent: "root" });
        expect(tenants.length).toBe(1);
        expect(tenants[0]).toEqual({ id: "1", name: "Tenant #1", parent: "root" });

        await tenancy.createTenant({ id: "2", name: "Tenant #2", parent: "root" });
        const tenant2 = await tenancy.getTenantById("2");
        expect(tenant2.name).toEqual("Tenant #2");

        await tenancy.updateTenant("2", { name: "Tenant #2.1", description: "Subtenant" });
        await expect(tenancy.getTenantById("2")).resolves.toEqual({
            id: "2",
            name: "Tenant #2.1",
            description: "Subtenant",
            parent: "root"
        });

        await tenancy.deleteTenant("1");
        await tenancy.deleteTenant("2");

        await expect(tenancy.listTenants({ parent: "root" })).resolves.toEqual([]);
        await expect(tenancy.getTenantById("1")).resolves.toEqual(undefined);
        await expect(tenancy.getTenantById("2")).resolves.toEqual(undefined);
    });
});
