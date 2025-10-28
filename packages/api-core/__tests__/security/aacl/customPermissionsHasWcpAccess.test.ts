import { describe, test, expect, vi } from "vitest";
import { customPermissions } from "./mocks/customPermissions";
import { mockCreateGetWcpProjectEnvironment } from "./mocks/mockCreateGetWcpProjectEnvironment";
import { mockCreateGetWcpProjectLicense } from "./mocks/mockCreateGetWcpProjectLicense";

vi.mock("@webiny/wcp", async () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = await vi.importActual("@webiny/wcp");

    return {
        ...actual,
        getWcpProjectEnvironment: mockCreateGetWcpProjectEnvironment(),
        getWcpProjectLicense: mockCreateGetWcpProjectLicense(license => {
            license.package.features.advancedAccessControlLayer.enabled = true;
            return license;
        })
    };
});

// This import statement needs to be here.
// @see https://stackoverflow.com/a/67114668
import { createMockContextHandler } from "./mockContextHandler";

describe(`Custom permissions (no WCP access) test`, () => {
    test("should not be able to use custom permissions if the license doesn't permit it", async () => {
        const { handle } = createMockContextHandler({});

        const context = await handle();
        expect(await context.security.listPermissions()).toEqual([
            ...customPermissions,
            { name: "aacl", legacy: false, teams: false }
        ]);
    });
});
