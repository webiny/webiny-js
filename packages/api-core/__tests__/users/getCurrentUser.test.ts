import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { GetCurrentUserUseCase } from "~/features/users/GetCurrentUser/index.js";
import { users } from "~tests/mocks/users.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    IdentityContext
} from "~/features/security/IdentityContext/index.js";

class TestAuthorizer implements Authorizer.Interface {
    public permissions: SecurityPermission[] = [{ name: "*" }];

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions;
    }
}

describe("Get current user", function () {
    let container: Container;
    let authorizer: TestAuthorizer;

    const createUser = async () => {
        const result = await container.resolve(CreateUserUseCase).execute(users.userA);
        expect(result.isOk()).toBe(true);
        return result.value;
    };

    const setIdentity = (type: string, id: string) => {
        container
            .resolve(IdentityContext)
            .setIdentity(new AuthenticatedIdentity({ id, type, displayName: "Test identity" }));
    };

    beforeEach(async () => {
        container = new Container();
        authorizer = new TestAuthorizer();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        container.registerInstance(Authorizer, authorizer);

        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenantValue.create());
    });

    it("should return the user of an admin identity that has no users permission", async () => {
        const user = await createUser();

        authorizer.permissions = [{ name: "cms.settings" }];
        setIdentity("admin", user.id);

        // Loading any user is not allowed...
        const getUserResult = await container.resolve(GetUserUseCase).execute({ id: user.id });
        expect(getUserResult.isFail()).toBe(true);
        expect(getUserResult.error.code).toBe("AdminUser/NotAuthorized");

        // ...but loading own user is.
        const result = await container.resolve(GetCurrentUserUseCase).execute();
        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({ id: user.id, email: users.userA.email });
    });

    it("should not return a user to an anonymous identity", async () => {
        await createUser();

        container.resolve(IdentityContext).setIdentity(new AnonymousIdentity());

        const result = await container.resolve(GetCurrentUserUseCase).execute();
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminUser/NotAuthorized");
    });

    it("should not return a user to an identity that is not an admin", async () => {
        const user = await createUser();

        // Even when the ID matches an existing user.
        setIdentity("api-key", user.id);

        const result = await container.resolve(GetCurrentUserUseCase).execute();
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminUser/NotAuthorized");
    });

    it("should fail when an admin identity has no user record", async () => {
        setIdentity("admin", "unknown-user-id");

        const result = await container.resolve(GetCurrentUserUseCase).execute();
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminUser/NotFound");
    });
});
