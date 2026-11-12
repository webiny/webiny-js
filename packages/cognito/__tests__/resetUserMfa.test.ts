import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { ApiCoreFeature } from "@webiny/api-core/ApiCoreFeature.js";
import { RootTenantValue } from "@webiny/api-core/domain/tenancy/RootTenantValue.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateUserUseCase as CoreCreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { CognitoApiFeature } from "~/api/CognitoApiFeature.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { LinkUserUseCase } from "~/api/features/LinkUser/index.js";
import { ResetUserMfaUseCase } from "~/api/features/ResetUserMfa/index.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";
import { adminUsers } from "~tests/mocks/users.js";
import { MockCognitoService } from "./mocks/MockCognitoService.js";
import { MockAuthorizer } from "./mocks/MockAuthorizer.js";

const acme = { id: "acme", name: "Acme", isInstalled: true } as Tenant;

describe("Admin Users (Cognito): resetting a user's MFA", () => {
    let container: Container;
    let mockCognitoService: MockCognitoService;

    const inTenant = (tenant: Tenant) => {
        container.resolve(TenantContext).setTenant(tenant);
    };

    const signInAs = (id: string) => {
        container
            .resolve(IdentityContext)
            .setIdentity(new AuthenticatedIdentity({ id, displayName: id, type: "admin" }));
    };

    const resetMfa = (id: string) => container.resolve(ResetUserMfaUseCase).execute(id);

    const createUser = async () => {
        const result = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);
        expect(result.isOk()).toBe(true);
        return result.value!;
    };

    beforeEach(async () => {
        container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        container.registerInstance(Authorizer, new MockAuthorizer());

        inTenant(RootTenantValue.create());

        mockCognitoService = new MockCognitoService();
        container.registerInstance(CognitoService, mockCognitoService);

        CognitoApiFeature.register(container);
    });

    it("deletes the TOTP software token of the user's Cognito account", async () => {
        const user = await createUser();
        const resetMfaSpy = vi.spyOn(mockCognitoService, "resetMfa");

        signInAs("root-admin");
        const result = await resetMfa(user.id);

        expect(result.isOk()).toBe(true);
        expect(resetMfaSpy).toHaveBeenCalledWith(adminUsers.userA.email);
        expect(mockCognitoService.getMfaResets(adminUsers.userA.email)).toBe(1);
    });

    it("refuses a federated user, whose identity provider manages their MFA", async () => {
        const externalResult = await container.resolve(CoreCreateUserUseCase).execute({
            id: "federated-user",
            email: "federated@example.com",
            firstName: "Federated",
            lastName: "User",
            external: true
        });
        expect(externalResult.isOk()).toBe(true);
        const resetMfaSpy = vi.spyOn(mockCognitoService, "resetMfa");

        const result = await resetMfa("federated-user");

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("Cognito/User/External");
        expect(resetMfaSpy).not.toHaveBeenCalled();
    });

    it("refuses an administrator without permission to manage users", async () => {
        const user = await createUser();
        vi.spyOn(container.resolve(IdentityContext), "getPermission").mockResolvedValue(null);
        const resetMfaSpy = vi.spyOn(mockCognitoService, "resetMfa");

        const result = await resetMfa(user.id);

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        expect(resetMfaSpy).not.toHaveBeenCalled();
    });

    it("refuses a user this tenant doesn't have", async () => {
        const user = await createUser();
        const resetMfaSpy = vi.spyOn(mockCognitoService, "resetMfa");

        inTenant(acme);
        const result = await resetMfa(user.id);

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("AdminUser/NotFound");
        expect(resetMfaSpy).not.toHaveBeenCalled();
    });

    it("reports Cognito's error when the reset fails", async () => {
        const user = await createUser();
        mockCognitoService.setShouldThrowError(new Error("User has no software token."));

        const result = await resetMfa(user.id);

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("Cognito/User/ResetMfa");
        expect(result.error?.message).toContain("User has no software token.");
    });

    it("lets an administrator of another of the person's tenants reset a shared account", async () => {
        const rootUser = await createUser();
        inTenant(acme);
        const linkResult = await container
            .resolve(LinkUserUseCase)
            .execute({ email: adminUsers.userA.email });
        expect(linkResult.isOk()).toBe(true);

        signInAs("acme-admin");
        const result = await resetMfa(rootUser.id);

        expect(result.isOk()).toBe(true);
        expect(mockCognitoService.getMfaResets(adminUsers.userA.email)).toBe(1);
    });
});
