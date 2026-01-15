import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { users } from "~tests/mocks/users.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { RootTenant } from "~/domain/tenancy/RootTenant.js";
import { RolesProvider, TeamsProvider } from "~/features/security/shared/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

class TestAuthorizer implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[] | null> {
        return [{ name: "*" }];
    }
}

describe("Users", function () {
    async function setupContainer() {
        // Create a new container for each test
        const container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        container.registerFactory(RolesProvider, () => () => Promise.resolve([]));
        container.registerFactory(TeamsProvider, () => () => Promise.resolve([]));
        container.registerInstance(Authorizer, new TestAuthorizer());

        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenant.create());

        return container;
    }

    it(`should create, update, and delete admin user profile`, async () => {
        const container = await setupContainer();
        const createUser = container.resolve(CreateUserUseCase);

        const result = await createUser.execute(users.userA);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            id: expect.any(String),
            email: users.userA.email,
            firstName: users.userA.firstName,
            lastName: users.userA.lastName
        });
    });
});
