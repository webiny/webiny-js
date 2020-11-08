import useGqlHandler from "./useGqlHandler";

describe("Tenancy context test", () => {
    const { createTenant, listTenants } = useGqlHandler();

    test("create default and child tenants", async () => {
        // Create default tenant
        let [{ data }] = await createTenant({ data: { name: "Default" } });
        const defaultTenant = data.tenants.createTenant.data;

        expect(defaultTenant).toMatchObject({
            name: "Default",
            parent: null
        });

        // Create tenant as a child of top-level tenant
        [{ data }] = await createTenant(
            { data: { name: "Restaurant 0" } },
            { "X-Tenant": defaultTenant.id }
        );

        const tenant1 = data.tenants.createTenant.data;

        expect(tenant1).toMatchObject({
            name: "Restaurant 0",
            parent: defaultTenant.id
        });

        // Create another tenant as a child of top-level tenant
        [{ data }] = await createTenant(
            { data: { name: "Restaurant 1" } },
            { "X-Tenant": defaultTenant.id }
        );
        
        // Create tenant as a child of tenant1
        await createTenant(
            { data: { name: "Restaurant 2" } },
            { "X-Tenant": tenant1.id }
        );

        // Load tenants that are direct children of top-level tenant
        [{ data }] = await listTenants({}, { "X-Tenant": defaultTenant.id });
        let tenants = data.tenants.listTenants.data;
        expect(tenants.length).toBe(2);
        expect(tenants[0].name).toBe("Restaurant 1");
        expect(tenants[1].name).toBe("Restaurant 0");

        // Load tenants that are direct children of a child tenant
        [{ data }] = await listTenants({}, { "X-Tenant": tenant1.id });
        tenants = data.tenants.listTenants.data;
        expect(tenants.length).toBe(1);
        expect(tenants[0].name).toBe("Restaurant 2");
    });
});
