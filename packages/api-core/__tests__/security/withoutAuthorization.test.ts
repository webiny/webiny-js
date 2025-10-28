import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di-container";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import { AuthorizationContextFeature } from "~/features/security/authorization/AuthorizationContext/feature.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";

const fullPermissions = {
    name: "*"
};

describe("without authorization", function () {
    let container: Container;
    let identityContext: IdentityContext.Interface;

    beforeEach(async () => {
        // Create a new container for each test
        container = new Container();

        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        WcpContextFeature.register(container, testLicense);
        AuthorizationContextFeature.register(container);
        IdentityContextFeature.register(container);

        // Resolve the identity context
        identityContext = container.resolve(IdentityContext);
    });

    it(`should disable authorization inside "withoutAuthorization" execution scope`, async () => {
        /**
         * Should not return permission as user does not have it (not defined in this case)
         */
        const noPermissionCheck = await identityContext.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(null);
        /**
         * Should return full permission as we are disabling authorization.
         */
        const result = await identityContext.withoutAuthorization(async () => {
            return identityContext.getPermission("some-unknown-permission");
        });

        expect(result).toEqual(fullPermissions);
        /**
         * Should not have permission again.
         */
        const noPermissionCheckAfterWithoutAuthorization =
            await identityContext.getPermission("some-unknown-permission");
        expect(noPermissionCheckAfterWithoutAuthorization).toEqual(null);
    });

    it("should re-enable authorization if callback throws an error", async () => {
        let error: Error | null = null;
        let result: any = null;
        let authorizationWithinCallback = null;

        const noPermissionCheck = await identityContext.getPermission("some-unknown-permission");
        expect(noPermissionCheck).toEqual(null);

        try {
            result = await identityContext.withoutAuthorization(async () => {
                authorizationWithinCallback = identityContext.isAuthorizationEnabled();
                throw new Error("Some error");
            });
        } catch (ex) {
            error = ex;
        }

        expect(result).toBeNull();
        expect(error?.message).toEqual("Some error");
        expect(authorizationWithinCallback).toBe(false);
        expect(identityContext.isAuthorizationEnabled()).toBe(true);

        const stillNoPermissionCheck =
            await identityContext.getPermission("some-unknown-permission");
        expect(stillNoPermissionCheck).toEqual(null);
    });
});
