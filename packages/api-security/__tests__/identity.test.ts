import { Security } from "~/types";
import { createSecurity } from "~/createSecurity";

describe("identity test", () => {
    const tenant = "root";
    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    let security: Security = null;

    beforeAll(async () => {
        security = await createSecurity({
            getTenant: () => tenant,
            storageOperations
        });
    });

    it("should create, update, delete, and list tenant links", async () => {
        const link1 = {
            tenant,
            identity: "1",
            type: "permissions",
            data: { group: "full-access" }
        };

        const link2 = { tenant, identity: "2", type: "role", data: { role: "OWNER" } };

        await security.createTenantLinks([link1, link2]);

        const linksByIdentity = await security.listTenantLinksByIdentity({
            identity: "1"
        });

        expect(linksByIdentity[0]).toEqual({
            ...link1,
            createdOn: expect.any(String),
            webinyVersion: process.env.WEBINY_VERSION
        });

        const linksByType = await security.listTenantLinksByType({
            type: "permissions",
            tenant
        });

        expect(linksByType[0]).toEqual({
            ...link1,
            createdOn: expect.any(String),
            webinyVersion: process.env.WEBINY_VERSION
        });

        const linksByTenant = await security.listTenantLinksByTenant({
            tenant
        });

        expect(linksByTenant).toEqual([
            { ...link1, createdOn: expect.any(String), webinyVersion: process.env.WEBINY_VERSION },
            { ...link2, createdOn: expect.any(String), webinyVersion: process.env.WEBINY_VERSION }
        ]);

        await security.updateTenantLinks([{ ...link2, type: "idp" }]);

        const idpLinks = await security.listTenantLinksByType({
            tenant,
            type: "idp"
        });

        expect(idpLinks.length).toBe(1);

        await security.deleteTenantLinks([
            { identity: "1", tenant },
            { identity: "2", tenant }
        ]);

        const remainingLinksByTenant = await security.listTenantLinksByTenant({
            tenant
        });

        expect(remainingLinksByTenant.length).toBe(0);
    });
});
