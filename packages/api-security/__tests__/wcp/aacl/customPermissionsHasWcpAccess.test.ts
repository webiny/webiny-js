import { customPermissions } from "./mocks/customPermissions";
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
        getWcpProjectLicense: mockCreateGetWcpProjectLicense(license => {
            license.package.features.advancedAccessControlLayer.enabled = true;
            return license;
        })
    };
});

// This import statement needs to be here.
// @see https://stackoverflow.com/a/67114668
import useTestHandler from "./useTestHandler";

describe(`Custom permissions (has WCP access) test`, () => {
    test("should be able to use custom permissions if the license permits it", async () => {
        const { invoke } = useTestHandler();
        const context = await invoke();

        expect(await context.security.getPermissions()).toEqual([
            ...customPermissions,
            { name: "wcp", aacl: true }
        ]);
    });
});
