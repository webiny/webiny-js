import useGqlHandler from "./useGqlHandler";

describe(`Test "Tenant Manager"`, () => {
    test(`should create/update/list/delete tenants`, async () => {
        const handler = useGqlHandler();

        await handler.install();

        const tenant1Data = {
            name: "Tenant #1",
            description: "The first sub-tenant",
            tags: [],
            settings: {
                domains: [{ fqdn: "domain1.com" }]
            }
        };

        const tenant2Data = {
            name: "Tenant #2",
            description: "The second sub-tenant",
            tags: ["child"],
            settings: {
                domains: [{ fqdn: "domain2.com" }]
            }
        };

        // Create
        const [response1] = await handler.createTenant({ data: tenant1Data });
        const tenant1 = response1.data.tenancy.createTenant.data;
        expect(tenant1).toEqual({
            id: expect.any(String),
            name: "Tenant #1",
            description: "The first sub-tenant",
            tags: [],
            parent: "root",
            settings: {
                domains: [{ fqdn: "domain1.com" }]
            }
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
            tags: ["child"],
            parent: "root",
            settings: {
                domains: [{ fqdn: "domain2.com" }]
            }
        });

        // List
        const [listResponse2] = await handler.listTenants();
        const tenants2 = listResponse2.data.tenancy.listTenants.data;
        expect(tenants2).toEqual([tenant1, tenant2]);

        // Update
        const [response3] = await handler.updateTenant({
            id: tenant1.id,
            data: {
                name: "Updated #1",
                description: "Updated desc",
                settings: tenant1.settings,
                tags: ["child", "blog"]
            }
        });

        const tenant1a = response3.data.tenancy.updateTenant.data;
        expect(tenant1a).toEqual({
            id: expect.any(String),
            name: "Updated #1",
            description: "Updated desc",
            tags: ["child", "blog"],
            parent: "root",
            settings: tenant1.settings
        });

        // Delete
        await handler.deleteTenant({ id: tenant1.id });

        const [listResponse3] = await handler.listTenants();
        const tenants3 = listResponse3.data.tenancy.listTenants.data;
        expect(tenants3).toEqual([tenant2]);
    });

    test(`should enforce security rules`, async () => {
        const anonHandler = useGqlHandler({ identity: null });
        const authHandler = useGqlHandler();

        const notAuthorizedResponse = {
            data: null,
            error: {
                code: "SECURITY_NOT_AUTHORIZED",
                message: "Not authorized!",
                data: null
            }
        };

        await anonHandler.install();

        const tenant1Data = {
            name: "Tenant #1",
            description: "The first sub-tenant",
            tags: [],
            settings: {
                domains: [{ fqdn: "domain1.com" }]
            }
        };

        // Create
        {
            const [response1] = await anonHandler.createTenant({ data: tenant1Data });
            const tenant1 = response1.data.tenancy.createTenant;
            expect(tenant1).toEqual(notAuthorizedResponse);
        }

        // Create a tenant using a valid identity
        const [response1] = await authHandler.createTenant({ data: tenant1Data });
        const tenant1 = response1.data.tenancy.createTenant.data;

        // List with anonymous identity
        {
            const [listResponse1] = await anonHandler.listTenants();
            const tenants1 = listResponse1.data.tenancy.listTenants;
            expect(tenants1).toEqual(notAuthorizedResponse);
        }

        // List with a valid identity
        {
            const [listResponse1] = await authHandler.listTenants();
            const tenants1 = listResponse1.data.tenancy.listTenants.data;
            expect(tenants1).toEqual([tenant1]);
        }

        // Update with anonymous identity
        {
            const [updateResponse] = await anonHandler.updateTenant({
                id: tenant1.id,
                data: {
                    name: "Updated #1",
                    description: "Updated desc",
                    tags: [],
                    settings: tenant1.settings
                }
            });

            const updatedTenant1 = updateResponse.data.tenancy.updateTenant;
            expect(updatedTenant1).toEqual(notAuthorizedResponse);
        }

        // Update with a valid identity
        const [updateResponse] = await authHandler.updateTenant({
            id: tenant1.id,
            data: {
                name: "Updated #1",
                description: "Updated desc",
                tags: [],
                settings: tenant1.settings
            }
        });

        const tenant1a = updateResponse.data.tenancy.updateTenant.data;
        expect(tenant1a).toEqual({
            id: expect.any(String),
            name: "Updated #1",
            description: "Updated desc",
            tags: [],
            parent: "root",
            settings: tenant1.settings
        });

        // Delete using anonymous identity
        const [deleteResponse] = await anonHandler.deleteTenant({ id: tenant1.id });
        expect(deleteResponse.data.tenancy.deleteTenant).toEqual(notAuthorizedResponse);
    });
});
