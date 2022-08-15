import { mockCreateGetWcpProjectEnvironment } from "./mocks/mockCreateGetWcpProjectEnvironment";
import { mockCreateGetWcpProjectLicense } from "./mocks/mockCreateGetWcpProjectLicense";

jest.mock("@webiny/api-wcp/utils", () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = jest.requireActual("@webiny/api-wcp/utils");

    return {
        ...actual,
        getWcpProjectEnvironment: mockCreateGetWcpProjectEnvironment()
    };
});

jest.mock("@webiny/wcp", () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = jest.requireActual("@webiny/wcp");

    return {
        ...actual,
        getWcpProjectLicense: mockCreateGetWcpProjectLicense()
    };
});

// This import statement needs to be here.
// @see https://stackoverflow.com/a/67114668
import useTestHandler from "./useTestHandler";

describe(`Custom permissions (no WCP access) test`, () => {
    test("should not be able to use custom permissions if the license doesn't permit it", async () => {
        const { invoke } = useTestHandler({
            overrideStorageOperations: storageOperations => {
                storageOperations.getSystemData = () => {
                    return {
                        installedOn: "3000-01-01T00:00:00.000Z"
                    };
                };
            }
        });

        const context = await invoke();
        expect(await context.security.getPermissions()).toEqual([
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
            { name: "*" },
            { name: "wcp", aacl: false }
        ]);
    });
});
