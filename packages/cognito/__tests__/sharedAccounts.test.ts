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
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import { Result } from "@webiny/feature/api";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { CognitoApiFeature } from "~/api/CognitoApiFeature.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { UpdateUserUseCase } from "~/api/features/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/api/features/DeleteUser/index.js";
import { LinkUserUseCase } from "~/api/features/LinkUser/index.js";
import { CheckEmailUseCase } from "~/api/features/CheckEmail/index.js";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { GetRoleUseCase } from "@webiny/api-core/features/security/roles/GetRole/index.js";
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

    /** Creates userA in root, then links the same account in Acme. */
    const createInRootAndAcme = async () => {
        inTenant(RootTenantValue.create());
        const rootResult = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);
        expect(rootResult.isOk()).toBe(true);

        inTenant(acme);
        const acmeResult = await container
            .resolve(LinkUserUseCase)
            .execute({ email: adminUsers.userA.email });
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
        it("refuses, so the account has to be linked, and creates nothing", async () => {
            const createUser = container.resolve(CreateUserUseCase);
            const rootResult = await createUser.execute(adminUsers.userA);
            const createUserSpy = vi.spyOn(mockCognitoService, "createUser");

            inTenant(acme);
            const result = await createUser.execute({
                ...adminUsers.userA,
                password: "AnotherPass123!"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/ExistsInOtherTenant");
            expect(createUserSpy).not.toHaveBeenCalled();

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootResult.value!.id
            });
            expect(records.map(record => record.tenant)).toEqual(["root"]);
        });

        it("refuses an account without a user ID as an existing account", async () => {
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

    describe("linking an existing account", () => {
        it("adds the account to the tenant with its ID, its name and the given roles", async () => {
            const rootResult = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);
            const rootUser = rootResult.value!;
            const createUserSpy = vi.spyOn(mockCognitoService, "createUser");
            const setPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");
            const updateAttributesSpy = vi.spyOn(mockCognitoService, "updateUserAttributes");

            inTenant(acme);
            const result = await container.resolve(LinkUserUseCase).execute({
                email: adminUsers.userA.email,
                roles: ["editors"],
                teams: ["writers"]
            });

            expect(result.isOk()).toBe(true);
            expect(result.value).toMatchObject({
                id: rootUser.id,
                tenant: "acme",
                email: adminUsers.userA.email,
                // Name is global per person: it comes from their existing record.
                firstName: rootUser.firstName,
                lastName: rootUser.lastName,
                displayName: rootUser.displayName,
                roles: ["editors"],
                teams: ["writers"]
            });
            // The account is left as it is.
            expect(createUserSpy).not.toHaveBeenCalled();
            expect(setPasswordSpy).not.toHaveBeenCalled();
            expect(updateAttributesSpy).not.toHaveBeenCalled();

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            expect(records.map(record => record.tenant).sort()).toEqual(["acme", "root"]);
        });

        it("takes the name from the account when the person has no records left", async () => {
            await mockCognitoService.createUser({
                username: adminUsers.userA.email,
                temporaryPassword: "x",
                attributes: {
                    email: adminUsers.userA.email,
                    preferredUsername: adminUsers.userA.email,
                    givenName: "From",
                    familyName: "Cognito",
                    customId: "orphan-id"
                }
            });

            inTenant(acme);
            const result = await container
                .resolve(LinkUserUseCase)
                .execute({ email: adminUsers.userA.email });

            expect(result.isOk()).toBe(true);
            expect(result.value).toMatchObject({
                id: "orphan-id",
                firstName: "From",
                lastName: "Cognito"
            });
        });

        it("refuses an email the tenant already has", async () => {
            await createInRootAndAcme();

            const result = await container
                .resolve(LinkUserUseCase)
                .execute({ email: adminUsers.userA.email });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Exists");
        });

        it("refuses an email without an account", async () => {
            inTenant(acme);
            const result = await container
                .resolve(LinkUserUseCase)
                .execute({ email: "nobody@example.com" });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/NotFound");
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

            inTenant(acme);
            const result = await container
                .resolve(LinkUserUseCase)
                .execute({ email: adminUsers.userA.email });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/Account/Exists");
        });

        it("refuses an administrator without permission to manage users", async () => {
            await container.resolve(CreateUserUseCase).execute(adminUsers.userA);
            vi.spyOn(container.resolve(IdentityContext), "getPermission").mockResolvedValue(null);

            inTenant(acme);
            const result = await container
                .resolve(LinkUserUseCase)
                .execute({ email: adminUsers.userA.email });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        });
    });

    describe("checking an email", () => {
        const checkEmail = (email: string) => container.resolve(CheckEmailUseCase).execute(email);

        it("tells whether the email is new, in this tenant, or in another tenant", async () => {
            await container.resolve(CreateUserUseCase).execute(adminUsers.userA);

            expect((await checkEmail(adminUsers.userA.email)).value).toBe("EXISTS_HERE");
            expect((await checkEmail(adminUsers.userB.email)).value).toBe("AVAILABLE");

            inTenant(acme);
            expect((await checkEmail(adminUsers.userA.email)).value).toBe("EXISTS_ELSEWHERE");
        });

        it("refuses an administrator without permission to manage users", async () => {
            vi.spyOn(container.resolve(IdentityContext), "getPermission").mockResolvedValue(null);

            const result = await checkEmail(adminUsers.userA.email);

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("AdminUser/NotAuthorized");
        });
    });

    describe("installing a tenant", () => {
        it("links the new tenant's admin when their email already has an account", async () => {
            const rootResult = await container.resolve(CreateUserUseCase).execute(adminUsers.userA);
            container.registerInstance(GetRoleUseCase, {
                execute: async () => Result.ok({ id: "full-access-role" })
            } as unknown as GetRoleUseCase.Interface);
            const setPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");

            inTenant(acme);
            const installer = container
                .resolveAll(AppInstaller)
                .find(installer => installer.appName === "Cognito")!;
            await installer.install(acme, {
                firstName: "Other",
                lastName: "Name",
                email: adminUsers.userA.email,
                password: "IgnoredPass123!"
            });

            const acmeRecord = await storage().usersStorageOperations.getUser({
                where: { tenant: "acme", id: rootResult.value!.id }
            });
            expect(acmeRecord).toMatchObject({
                firstName: adminUsers.userA.firstName,
                roles: ["full-access-role"]
            });
            expect(setPasswordSpy).not.toHaveBeenCalled();
        });
    });

    describe("deleting a user", () => {
        it("keeps the account while another tenant still has the user", async () => {
            const { acmeUser } = await createInRootAndAcme();

            inTenant(acme);
            const deleteResult = await container.resolve(DeleteUserUseCase).execute(acmeUser.id);

            expect(deleteResult.isOk()).toBe(true);
            expect((await mockCognitoService.getUser(adminUsers.userA.email)) !== null).toBe(true);

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
            expect((await mockCognitoService.getUser(adminUsers.userA.email)) !== null).toBe(false);
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
            const userBResult = await container
                .resolve(CreateUserUseCase)
                .execute(adminUsers.userB);
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

        it("leaves every tenant's record as it was when Cognito rejects the change", async () => {
            const { rootUser, acmeUser } = await createInRootAndAcme();
            vi.spyOn(mockCognitoService, "updateUserAttributes").mockRejectedValueOnce(
                new Error("Cognito is down")
            );

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                email: "renamed@example.com",
                firstName: "Renamed"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/User/Update");

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            const byTenant = Object.fromEntries(records.map(record => [record.tenant, record]));
            expect(byTenant.root).toMatchObject({
                email: rootUser.email,
                firstName: rootUser.firstName,
                displayName: rootUser.displayName
            });
            expect(byTenant.acme).toMatchObject({
                email: acmeUser.email,
                firstName: acmeUser.firstName,
                displayName: acmeUser.displayName
            });

            // The old email still finds the record in each tenant.
            for (const tenant of ["root", "acme"]) {
                const byEmail = await storage().usersStorageOperations.getUser({
                    where: { tenant, email: rootUser.email }
                });
                expect(byEmail?.id).toBe(rootUser.id);
            }
        });

        it("puts this tenant's record back when another tenant's record can't be synced", async () => {
            const { rootUser, acmeUser } = await createInRootAndAcme();
            const repository = container.resolve(AdminUsersRepository);
            const update = repository.update.bind(repository);
            let failedOnce = false;
            vi.spyOn(repository, "update").mockImplementation(async user => {
                if (user.tenant === "root" && !failedOnce) {
                    failedOnce = true;
                    return Result.fail(new UserStorageError(new Error("Write failed")));
                }
                return update(user);
            });
            const updateAttributesSpy = vi.spyOn(mockCognitoService, "updateUserAttributes");

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                firstName: "Renamed"
            });

            expect(result.isFail()).toBe(true);
            expect(updateAttributesSpy).not.toHaveBeenCalled();

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            const byTenant = Object.fromEntries(records.map(record => [record.tenant, record]));
            expect(byTenant.root?.firstName).toBe(rootUser.firstName);
            expect(byTenant.acme?.firstName).toBe(acmeUser.firstName);
        });

        it("names the tenants whose records can't be put back after Cognito rejects the change", async () => {
            const { rootUser, acmeUser } = await createInRootAndAcme();
            const repository = container.resolve(AdminUsersRepository);
            const update = repository.update.bind(repository);
            let rootWrites = 0;
            vi.spyOn(repository, "update").mockImplementation(async user => {
                // The first write to root is the sync; every later one is a rollback attempt.
                if (user.tenant === "root" && ++rootWrites >= 2) {
                    return Result.fail(new UserStorageError(new Error("Write failed")));
                }
                return update(user);
            });
            vi.spyOn(mockCognitoService, "updateUserAttributes").mockRejectedValueOnce(
                new Error("Cognito is down")
            );

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                firstName: "Renamed"
            });

            expect(result.isFail()).toBe(true);
            // The sync, the rollback and its two retries.
            expect(rootWrites).toBe(4);
            expect(result.error?.code).toBe("Cognito/User/UpdateRollback");
            expect(result.error?.data).toMatchObject({
                error: { code: "Cognito/User/Update" },
                tenants: ["root"]
            });

            // Acme's record was put back; root's still has the new name.
            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            const byTenant = Object.fromEntries(records.map(record => [record.tenant, record]));
            expect(byTenant.acme?.firstName).toBe(acmeUser.firstName);
            expect(byTenant.root?.firstName).toBe("Renamed");
        });

        it("retries a rollback write that fails and puts the record back", async () => {
            const { rootUser, acmeUser } = await createInRootAndAcme();
            const repository = container.resolve(AdminUsersRepository);
            const update = repository.update.bind(repository);
            let rootWrites = 0;
            vi.spyOn(repository, "update").mockImplementation(async user => {
                // The first write to root is the sync, the second is the first rollback attempt.
                if (user.tenant === "root" && ++rootWrites === 2) {
                    return Result.fail(new UserStorageError(new Error("Write failed")));
                }
                return update(user);
            });
            vi.spyOn(mockCognitoService, "updateUserAttributes").mockRejectedValueOnce(
                new Error("Cognito is down")
            );

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                firstName: "Renamed"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/User/Update");
            expect(rootWrites).toBe(3);

            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            const byTenant = Object.fromEntries(records.map(record => [record.tenant, record]));
            expect(byTenant.root?.firstName).toBe(rootUser.firstName);
            expect(byTenant.acme?.firstName).toBe(acmeUser.firstName);
        });

        it("keeps the records when only the password change fails", async () => {
            const { rootUser } = await createInRootAndAcme();
            vi.spyOn(mockCognitoService, "setPermanentPassword").mockRejectedValueOnce(
                new Error("Cognito is down")
            );

            signInAs(rootUser.id);
            inTenant(acme);
            const result = await container.resolve(UpdateUserUseCase).execute(rootUser.id, {
                firstName: "Renamed",
                password: "NewPass123!"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error?.code).toBe("Cognito/User/Update");

            // The name already reached Cognito, so the records keep it.
            const records = await storage().usersStorageOperations.listUserRecords({
                id: rootUser.id
            });
            expect(records.map(record => record.firstName)).toEqual(["Renamed", "Renamed"]);
        });
    });
});
