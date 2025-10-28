import { describe, test, expect, vi } from "vitest";
import { mockCreateGetWcpProjectEnvironment } from "./mocks/mockCreateGetWcpProjectEnvironment";
import { mockCreateGetWcpProjectLicense } from "./mocks/mockCreateGetWcpProjectLicense";

vi.mock("@webiny/api-wcp/utils", async () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = await vi.importActual("@webiny/api-wcp/utils");

    return {
        ...actual,
        getWcpProjectEnvironment: mockCreateGetWcpProjectEnvironment()
    };
});

vi.mock("@webiny/wcp", async () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = await vi.importActual("@webiny/wcp");

    return {
        ...actual,
        getWcpProjectLicense: mockCreateGetWcpProjectLicense()
    };
});

// This import statement needs to be here.
// @see https://stackoverflow.com/a/67114668
import { createMockContextHandler } from "./mockContextHandler";

describe(`Custom permissions (no WCP access) test`, () => {
    test("should not be able to use custom permissions if the license doesn't permit it", async () => {
        const { handle } = createMockContextHandler({
            overrideSecurityStorage: securityStorage => {
                securityStorage.storageOperations.getSystemData = () => {
                    return {
                        installedOn: "3000-01-01T00:00:00.000Z"
                    };
                };
            }
        });

        const context = await handle();
        expect(await context.security.listPermissions()).toEqual([
            { something: "custom" },
            { name: "custom" },
            {
                locales: ["en-US"],
                name: "content.i18n"
            },
            { name: "pb.*" },
            { name: "cms.*" },
            { name: "security.*" },
            { name: "adminUsers.*" },
            { name: "i18n.*" },
            { name: "*" }
        ]);
    });
});
