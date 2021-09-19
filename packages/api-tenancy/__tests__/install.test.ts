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

    test(`should return null for "version"`, async () => {
        const version = await tenancy.system.getVersion();
        const isInstalled = await tenancy.system.isInstalled();
        expect(version).toBe(null);
        expect(isInstalled).toEqual(false);
    });

    test(`should run "install" successfully`, async () => {
        let isInstalled = await tenancy.system.isInstalled();
        expect(isInstalled).toEqual(false);

        await tenancy.system.install();

        // Let's see whether "isInstalled" return true now?
        isInstalled = await tenancy.system.isInstalled();
        expect(isInstalled).toEqual(true);

        // There has to be a "root" tenant
        const rootTenant = await tenancy.tenants.getRootTenant();
        expect(rootTenant.id).toEqual("root");

        // There must be a version stored
        return expect(tenancy.system.getVersion()).resolves.toEqual("1.0.0");
    });

    test(`should prevent "install" from being executed twice`, async () => {
        await tenancy.system.install();

        expect.assertions(2);

        return tenancy.system.install().catch(err => {
            expect(err.message).toEqual("Tenancy is already installed.");
            expect(err.code).toEqual("TENANCY_INSTALL_ABORTED");
        });
    });
});
