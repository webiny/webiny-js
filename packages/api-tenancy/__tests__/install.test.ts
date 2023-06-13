import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { Tenancy, TenancyStorageOperations } from "~/types";
import { createTenancy } from "~/createTenancy";

describe(`Test "Tenancy" install`, () => {
    const { storageOperations } = getStorageOps<TenancyStorageOperations>("tenancy");
    let tenancy: Tenancy;

    beforeEach(async () => {
        tenancy = await createTenancy({
            tenant: null,
            storageOperations,
            incrementWcpTenants: async () => {
                return Promise.resolve();
            },
            decrementWcpTenants: async () => {
                return Promise.resolve();
            }
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
            tags: [],
            webinyVersion: process.env.WEBINY_VERSION,
            parent: null,
            createdOn: expect.any(String),
            savedOn: expect.any(String),
            status: "active",
            settings: {
                domains: []
            }
        });

        // There must be a version stored
        return expect(tenancy.getVersion()).resolves.toEqual(process.env.WEBINY_VERSION);
    });

    test(`should prevent "install" from being executed twice`, async () => {
        await tenancy.install();
        expect.assertions(2);

        try {
            await tenancy.install();
        } catch (err) {
            expect(err.message).toEqual("Tenancy is already installed.");
            expect(err.code).toEqual("TENANCY_INSTALL_ABORTED");
        }
    });
});
