import { Security } from "~/Security";
import { PluginsContainer } from "@webiny/plugins";

describe("identity test", () => {
    const tenant = "root";
    // @ts-ignore
    const storageOperationsPlugins = __getStorageOperationsPlugins();
    let security: Security = null;

    beforeAll(async () => {
        security = new Security({
            tenant,
            plugins: new PluginsContainer(storageOperationsPlugins()),
            version: "1.0.0"
        });

        await security.init();
    });

    it("should create, update, delete, and list tenant links", async () => {
        const link1 = {
            tenant,
            identity: "1",
            type: "group",
            data: { group: "full-access" }
        };

        const link2 = { tenant, identity: "2", type: "role", data: { role: "OWNER" } };

        await security.identity.createTenantLinks([link1, link2]);

        const linksByIdentity = await security.identity.listTenantLinksByIdentity({
            identity: "1"
        });

        expect(linksByIdentity[0]).toEqual(link1);

        const linksByType = await security.identity.listTenantLinksByType({
            type: "group",
            tenant
        });

        expect(linksByType[0]).toEqual(link1);

        const linksByTenant = await security.identity.listTenantLinksByTenant({
            tenant
        });

        expect(linksByTenant).toEqual([link1, link2]);

        await security.identity.updateTenantLinks([{ ...link2, type: "idp" }]);

        const idpLinks = await security.identity.listTenantLinksByType({
            tenant,
            type: "idp"
        });

        expect(idpLinks.length).toBe(1);

        await security.identity.deleteTenantLinks([
            { identity: "1", tenant },
            { identity: "2", tenant }
        ]);

        const remainingLinksByTenant = await security.identity.listTenantLinksByTenant({
            tenant
        });

        expect(remainingLinksByTenant.length).toBe(0);
    });
});
