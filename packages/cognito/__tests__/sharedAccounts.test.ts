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
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { CognitoApiFeature } from "~/api/CognitoApiFeature.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { UpdateUserUseCase } from "~/api/features/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/api/features/DeleteUser/index.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";
import { adminUsers } from "~tests/mocks/users.js";
import { MockCognitoService } from "./mocks/MockCognitoService.js";
import { MockAuthorizer } from "./mocks/MockAuthorizer.js";

const acme = { id: "acme", name: "Acme", isInstalled: true } as Tenant;

describe("Admin Users (Cognito): one account across tenants", () => {
    let container: Container;
    let mockCognitoService: MockCognitoService;

    const storage = () => getStorageOps<ApiCoreStorageOperations>("apiCore").storageOperations;

    const inTenant = (tenant: Tenant) => {
        container.resolve(TenantContext).setTenant(tenant);
    };

    const signInAs = (id: string) => {
        container
            .resolve(IdentityContext)
            .setIdentity(new AuthenticatedIdentity({ id, displayName: id, type: "admin" }));
    };

    /** Creates userA in root, then adds the same email in Acme. */
    const createInRootAndAcme = async () => {
        const createUser = container.resolve(CreateUserUseCase);

        inTenant(RootTenantValue.create());
        const rootResult = await createUser.execute(adminUsers.userA);
        expect(rootResult.isOk()).toBe(true);

        inTenant(acme);
        const acmeResult = await createUser.execute({
            ...adminUsers.userA,
            firstName: "Other",
            lastName: "Name",
            password: "AnotherPass123!"
        });
        expect(acmeResult.isOk()).toBe(true);

        return { rootUser: rootResult.value!, acmeUser: acmeResult.value! };
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

    describe("creating a user whose email already has an account", () => {
        it("adds the existing account to the tenant, with its ID, name and password", async () => {
            const { rootUser } = await createInRootAndAcme();
            const createUserSpy = vi.spyOn(mockCognitoService, "createUser");
            const setPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");

            // A second tenant: still no new account, and the password stays.
            const beta = { id: "beta", name: "Beta", isInstalled: true } as Tenant;
            inTenant(beta);
            const result = await container.resolve(CreateUserUseCase).execute({
                ...adminUsers.userA,
                password: "IgnoredPass123!"
            });

            expect(result.isOk()).toBe(true);
            expect(result.value).toMatchObject({
                id: rootUser.id,
                tenant: "beta",
                email: adminUsers.userA.email,
                // Name is global per person: it comes from their existing record.
                firstName: adminUsers.userA.firstName,
                lastName: adminUsers.userA.lastName,
                existingAccount: true
            });
            expect(createUserSpy).not.toHaveBeenCalled();
            expect(setPasswordSpy).not.toHaveBeenCalled();

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            expect(records.map(record => record.tenant).sort()).toEqual(["acme", "beta", "root"]);
        });

        it("marks a new account as not existing", async () => {
            const result = await container.resolve(CreateUserUseCase).execute(adminUsers.userB);

            expect(result.isOk()).toBe(true);
            expect(result.value?.existingAccount).toBeUndefined();
        });

        it("refuses to add the account to a tenant that already has the user", async () => {
            await createInRootAndAcme();

            const result = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Exists");
        });

        it("refuses an account without a user ID", async () => {
            await mockCognitoService.createUser({
                username: adminUsers.userA.email,
                temporaryPassword: "x",
                attributes: {
                    email: adminUsers.userA.email,
                    preferredUsername: adminUsers.userA.email,
                    customId: ""
                }
            });

            const result = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Exists");
        });
    });

    describe("deleting a user", () => {
        it("keeps the account while another tenant still has the user", async () => {
            const { acmeUser } = await createInRootAndAcme();

            inTenant(acme);
            const deleteResult = await container.resolve(DeleteUserUseCase).execute(acmeUser.id);

            expect(deleteResult.isOk()).toBe(true);
            expect(await mockCognitoService.userExists(adminUsers.userA.email)).toBe(true);

            // The user is gone from Acme only.
            const records = await storage().usersStorageOperations.listUserRecords({
                id: acmeUser.id
            });
            expect(records.map(record => record.tenant)).toEqual(["root"]);
        });

        it("deletes the account with the user's last tenant record", async () => {
            const { rootUser } = await createInRootAndAcme();

            inTenant(acme);
            await container.resolve(DeleteUserUseCase).execute(rootUser.id);

            inTenant(RootTenantValue.create());
            const deleteResult = await container.resolve(DeleteUserUseCase).execute(rootUser.id);

            expect(deleteResult.isOk()).toBe(true);
            expect(await mockCognitoService.userExists(adminUsers.userA.email)).toBe(false);
        });
    });

    describe("updating a shared account", () => {
        it("doesn't let an administrator change the person's password", async () => {
            const { acmeUser } = await createInRootAndAcme();
            const setPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");

            signInAs("acme-admin");
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(acmeUser.id, {
                password: "TakenOver123!"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Shared");
            expect(setPasswordSpy).not.toHaveBeenCalled();
        });

        it("doesn't let an administrator change the person's name or email", async () => {
            const { acmeUser } = await createInRootAndAcme();

            signInAs("acme-admin");
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(acmeUser.id, {
                email: "someone-else@example.com"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Shared");
        });

        it("lets an administrator change the person's roles in their tenant", async () => {
            const { acmeUser } = await createInRootAndAcme();

            signInAs("acme-admin");
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(acmeUser.id, {
                // The form sends the unchanged name and email along.
                email: acmeUser.email,
                firstName: acmeUser.firstName,
                lastName: acmeUser.lastName,
                roles: ["editors"]
            });

            expect(result.isOk()).toBe(true);
            expect(result.value?.roles).toEqual(["editors"]);
        });

        it("syncs the person's own name change to their other tenants", async () => {
            const { rootUser } = await createInRootAndAcme();

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                firstName: "Renamed",
                lastName: "Person"
            });

            expect(result.isOk()).toBe(true);

            const rootRecord = await storage().usersStorageOperations.getUser({
                where: { tenant: "root", id: rootUser.id }
            });
            expect(rootRecord).toMatchObject({
                firstName: "Renamed",
                lastName: "Person",
                displayName: result.value?.displayName
            });
        });

        it("refuses an email another user has in one of the person's other tenants", async () => {
            const { rootUser, acmeUser } = await createInRootAndAcme();

            // userB exists only in root.
            inTenant(RootTenantValue.create());
            const userBResult = await container.resolve(CreateUserUseCase).execute(adminUsers.userB);
            expect(userBResult.isOk()).toBe(true);
            const updateAttributesSpy = vi.spyOn(mockCognitoService, "updateUserAttributes");

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                email: adminUsers.userB.email
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/EmailTaken");
            expect(updateAttributesSpy).not.toHaveBeenCalled();

            // Nothing was written.
            const acmeRecord = await storage().usersStorageOperations.getUser({
                where: { tenant: "acme", id: rootUser.id }
            });
            expect(acmeRecord?.email).toBe(acmeUser.email);
        });
    });
});
