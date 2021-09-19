import { PluginsContainer } from "@webiny/plugins";
import { Tenancy } from "~/Tenancy";

describe(`Test "Tenancy" install`, () => {
    // @ts-ignore
    const storageOperationsPlugins = __getStorageOperationsPlugins();
    let tenancy: Tenancy = null;

    beforeAll(async () => {
        tenancy = new Tenancy({
            tenant: null,
            plugins: new PluginsContainer(storageOperationsPlugins()),
            version: "1.0.0"
        });

        await tenancy.init();
    });

    test(`should create/update/list/delete tenants`, async () => {
        await tenancy.tenants.createTenant({ id: "1", name: "Tenant #1", parent: "root" });
        const tenants = await tenancy.tenants.listTenants({ parent: "root" });
        expect(tenants.length).toBe(1);
        expect(tenants[0]).toEqual({ id: "1", name: "Tenant #1", parent: "root" });

        await tenancy.tenants.createTenant({ id: "2", name: "Tenant #2", parent: "root" });
        const tenant2 = await tenancy.tenants.getTenantById("2");
        expect(tenant2.name).toEqual("Tenant #2");

        await tenancy.tenants.updateTenant("2", { name: "Tenant #2.1", description: "Subtenant" });
        await expect(tenancy.tenants.getTenantById("2")).resolves.toEqual({
            id: "2",
            name: "Tenant #2.1",
            description: "Subtenant",
            parent: "root"
        });

        await tenancy.tenants.deleteTenant("1");
        await tenancy.tenants.deleteTenant("2");

        await expect(tenancy.tenants.listTenants({ parent: "root" })).resolves.toEqual([]);
        await expect(tenancy.tenants.getTenantById("1")).resolves.toEqual(undefined);
        await expect(tenancy.tenants.getTenantById("2")).resolves.toEqual(undefined);
    });
});
