import { Tenancy } from "~/types";
import { createTenancy } from "~/createTenancy";

describe(`Test "Tenancy" install`, () => {
    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    let tenancy: Tenancy = null;

    beforeEach(async () => {
        tenancy = await createTenancy({
            tenant: null,
            storageOperations
        });
    });

    test(`should return null for "version"`, async () => {
        const version = await tenancy.getVersion();
        expect(version).toBe(null);
    });

    test(`should run "install" successfully`, async () => {
        let version = await tenancy.getVersion();
        expect(version).toEqual(null);

        await tenancy.install();

        // Let's see if "getVersion" can return a version now
        version = await tenancy.getVersion();
        expect(version).toEqual(process.env.WEBINY_VERSION);

        // There has to be a "root" tenant
        const rootTenant = await tenancy.getRootTenant();
        expect(rootTenant).toEqual({
            id: "root",
            name: "Root",
            description: "The top-level Webiny tenant.",
            webinyVersion: process.env.WEBINY_VERSION
        });

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
