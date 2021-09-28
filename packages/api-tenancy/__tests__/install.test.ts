import { Tenancy } from "~/types";
import { createTenancy } from "~/Tenancy";

describe(`Test "Tenancy" install`, () => {
    // @ts-ignore
    const { storageOperationsFactory } = __getStorageOperations();
    let tenancy: Tenancy = null;

    beforeAll(async () => {
        tenancy = await createTenancy({
            tenant: null,
            storageOperations: storageOperationsFactory()
        });
    });

    test(`should return null for "version"`, async () => {
        const version = await tenancy.getVersion();
        const isInstalled = await tenancy.isInstalled();
        expect(version).toBe(null);
        expect(isInstalled).toEqual(false);
    });

    test(`should run "install" successfully`, async () => {
        let isInstalled = await tenancy.isInstalled();
        expect(isInstalled).toEqual(false);

        await tenancy.install();

        // Let's see whether "isInstalled" return true now?
        isInstalled = await tenancy.isInstalled();
        expect(isInstalled).toEqual(true);

        // There has to be a "root" tenant
        const rootTenant = await tenancy.getRootTenant();
        expect(rootTenant.id).toEqual("root");

        // There must be a version stored
        return expect(tenancy.getVersion()).resolves.toEqual(process.env.WEBINY_VERSION);
    });

    test(`should prevent "install" from being executed twice`, async () => {
        await tenancy.install();

        expect.assertions(2);

        return tenancy.install().catch(err => {
            expect(err.message).toEqual("Tenancy is already installed.");
            expect(err.code).toEqual("TENANCY_INSTALL_ABORTED");
        });
    });
});
