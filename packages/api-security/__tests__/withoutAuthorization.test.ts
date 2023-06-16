import { createSecurity } from "~/createSecurity";
import { Security, SecurityConfig } from "~/types";

const fullPermissions = {
    name: "*"
};

describe("without authorization", function () {
    let security: Security;
    const config: SecurityConfig = {
        advancedAccessControlLayer: true,
        storageOperations: {} as any,
        getTenant: () => {
            return "root";
        }
    };

    beforeEach(async () => {
        security = await createSecurity(config);
    });

    it("should disable authorization inside the withoutAuthorization method", async () => {
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

    it("should not enable authorization if it was disabled before the withoutAuthorization method", async () => {
        security.disableAuthorization();
        /**
         * Should have full permission as we are disabling authorization.
         */
        const noPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(fullPermissions);
        /**
         * Should return full permission as we are disabling authorization.
         */
        const result = await security.withoutAuthorization(async () => {
            return security.getPermission("some-unknown-permission");
        });

        expect(result).toEqual(fullPermissions);
        /**
         * Should have full permission as the authorization is not still enabled.
         */
        const hasPermissionsCheckAfterWithoutAuthorization = await security.getPermission(
            "some-unknown-permission"
        );
        expect(hasPermissionsCheckAfterWithoutAuthorization).toEqual(fullPermissions);
        security.enableAuthorization();
        /**
         * Should not have permission again.
         */
        const noPermissionCheckAfterEnabling = await security.getPermission(
            "some-unknown-permission"
        );
        expect(noPermissionCheckAfterEnabling).toEqual(null);
    });

    it("should enable authorization if there is an exception in the function - previously enabled authorization", async () => {
        let error: Error | null = null;
        let result: any = null;
        const noPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(null);
        try {
            result = await security.withoutAuthorization(async () => {
                throw new Error("Some error");
            });
        } catch (ex) {
            error = ex;
        }
        expect(result).toBeNull();
        expect(error?.message).toEqual("Some error");

        const stillNoPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(stillNoPermissionCheck).toEqual(null);
    });

    it("should not enable authorization if there is an exception in the function - previously disabled authorization", async () => {
        let error: Error | null = null;
        let result: any = null;
        security.disableAuthorization();
        const hasPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(hasPermissionCheck).toEqual(fullPermissions);
        try {
            result = await security.withoutAuthorization(async () => {
                throw new Error("Some error");
            });
        } catch (ex) {
            error = ex;
        }
        expect(result).toBeNull();
        expect(error?.message).toEqual("Some error");

        const stillHasPermissionCheck = await security.getPermission("some-unknown-permission");
        expect(stillHasPermissionCheck).toEqual(fullPermissions);
    });
});
