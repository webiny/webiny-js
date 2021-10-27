import useGqlHandler from "./useGqlHandler";

describe(`Test "Tenant Manager"`, () => {
    test(`should create/update/list/delete tenants`, async () => {
        const handler = useGqlHandler();

        await handler.install();

        const tenant1Data = {
            name: "Tenant #1",
            description: "The first sub-tenant"
        };

        const tenant2Data = {
            name: "Tenant #2",
            description: "The second sub-tenant"
        };

        // Create
        const [response1] = await handler.createTenant({ data: tenant1Data });
        const tenant1 = response1.data.tenancy.createTenant.data;
        expect(tenant1).toEqual({
            id: expect.any(String),
            name: "Tenant #1",
            description: "The first sub-tenant",
            parent: "root"
        });

        // List
        const [listResponse1] = await handler.listTenants();
        const tenants1 = listResponse1.data.tenancy.listTenants.data;
        expect(tenants1).toEqual([tenant1]);

        // Create
        const [response2] = await handler.createTenant({ data: tenant2Data });
        const tenant2 = response2.data.tenancy.createTenant.data;
        expect(tenant2).toEqual({
            id: expect.any(String),
            name: "Tenant #2",
            description: "The second sub-tenant",
            parent: "root"
        });

        // List
        const [listResponse2] = await handler.listTenants();
        const tenants2 = listResponse2.data.tenancy.listTenants.data;
        expect(tenants2).toEqual([tenant1, tenant2]);

        // Update
        const [response3] = await handler.updateTenant({
            id: tenant1.id,
            data: { name: "Updated #1", description: "Updated desc" }
        });

        const tenant1a = response3.data.tenancy.updateTenant.data;
        expect(tenant1a).toEqual({
            id: expect.any(String),
            name: "Updated #1",
            description: "Updated desc",
            parent: "root"
        });

        // Delete
        await handler.deleteTenant({ id: tenant1.id });

        const [listResponse3] = await handler.listTenants();
        const tenants3 = listResponse3.data.tenancy.listTenants.data;
        expect(tenants3).toEqual([tenant2]);
    });
});
