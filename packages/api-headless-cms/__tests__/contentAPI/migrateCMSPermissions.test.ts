import { migrateCMSPermissions } from "~/migrateCMSPermissions";
import * as mocked from "./mocks/cmsContentPermissions";

describe("migrate CMS permissions from v5.4.0 to v5.5.0", () => {
    test("should return same permission in case of 'full access'", async () => {
        const permissions = [{ name: "cms.*" }];

        const result = await migrateCMSPermissions(permissions, mocked.mockedGetModel);

        expect(result).toEqual(permissions);
    });

    test(`should move "groups" from contentEntry to contentModelGroup`, async () => {
        const result = await migrateCMSPermissions(
            mocked.permissionsOne.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.permissionsOne.output);
    });

    test(`should move "models" from contentEntry to contentModel`, async () => {
        const result = await migrateCMSPermissions(
            mocked.permissionTwo.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.permissionTwo.output);
    });

    test(`should add missing "groups" in contentModelGroup`, async () => {
        const result = await migrateCMSPermissions(
            mocked.permissionThree.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.permissionThree.output);
    });
});

describe(`should handle "own" access scope`, () => {
    test(`should add missing "read" access to contentModelGroup`, async () => {
        const result = await migrateCMSPermissions(
            mocked.ownPermissionOne.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.ownPermissionOne.output);
    });

    test(`should update contentEntry access scope to "own" if contentModel has "own" access scope`, async () => {
        const result = await migrateCMSPermissions(
            mocked.ownPermissionTwo.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.ownPermissionTwo.output);
    });

    test(`should add missing "read" access to contentModelGroup and contentModel`, async () => {
        const result = await migrateCMSPermissions(
            mocked.ownPermissionThree.input,
            mocked.mockedGetModel
        );

        expect(result).toEqual(mocked.ownPermissionThree.output);
    });
});
