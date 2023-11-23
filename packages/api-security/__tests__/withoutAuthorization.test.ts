import { createSecurity } from "~/createSecurity";
import { Security, SecurityConfig, SecurityStorageOperations } from "~/types";

const fullPermissions = {
    name: "*"
};

describe("without authorization", function () {
    let security: Security;
    const config: SecurityConfig = {
        advancedAccessControlLayer: {
            enabled: true,
            options: {
                teams: false,
                folderLevelPermissions: false,
                privateFiles: false
            }
        },
        storageOperations: {} as SecurityStorageOperations,
        getTenant: () => {
            return "root";
        }
    };

    beforeEach(async () => {
        security = await createSecurity(config);
    });

    it(`should disable authorization inside "withoutAuthorization" execution scope`, async () => {
        /**
         * Should not return permission as user does not have it (not defined in this case)
         */
        const noPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(null);
        /**
         * Should return full permission as we are disabling authorization.
         */
        const result = await security.withoutAuthorization(async () => {
            return security.getPermission("some-unknown-permission");
        });

        expect(result).toEqual(fullPermissions);
        /**
         * Should not have permission again.
         */
        const noPermissionCheckAfterWithoutAuthorization = await security.getPermission(
            "some-unknown-permission"
        );
        expect(noPermissionCheckAfterWithoutAuthorization).toEqual(null);
    });

    it("should re-enable authorization if callback throws an error", async () => {
        let error: Error | null = null;
        let result: any = null;
        let authorizationWithinCallback = null;

        const noPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(null);

        try {
            result = await security.withoutAuthorization(async () => {
                authorizationWithinCallback = security.isAuthorizationEnabled();
                throw new Error("Some error");
            });
        } catch (ex) {
            error = ex;
        }

        expect(result).toBeNull();
        expect(error?.message).toEqual("Some error");
        expect(authorizationWithinCallback).toBe(false);
        expect(security.isAuthorizationEnabled()).toBe(true);

        const stillNoPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(stillNoPermissionCheck).toEqual(null);
    });
});
