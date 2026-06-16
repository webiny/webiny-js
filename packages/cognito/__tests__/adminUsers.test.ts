import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { WcpContextFeature } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { ApiCoreFeature } from "@webiny/api-core/ApiCoreFeature.js";
import { RootTenantValue } from "@webiny/api-core/domain/tenancy/RootTenantValue.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { CognitoApiFeature } from "~/api/CognitoApiFeature.js";
import { CreateUserUseCase } from "~/api/features/CreateUser/index.js";
import { UpdateUserUseCase } from "~/api/features/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/api/features/DeleteUser/index.js";
import { adminUsers } from "~tests/mocks/users.js";
import {
    CognitoCreateUserError,
    CognitoDeleteUserError,
    CognitoUpdateUserError
} from "~/api/domain/errors.js";
import { MockCognitoService } from "./mocks/MockCognitoService.js";
import { MockAuthorizer } from "./mocks/MockAuthorizer.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

describe("Admin Users (Cognito)", () => {
    let container: Container;
    let mockCognitoService: MockCognitoService;

    beforeEach(async () => {
        // Create a new container for each test
        container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        // Register api-core features
        ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
        WcpContextFeature.register(container, testLicense);
        container.registerInstance(Authorizer, new MockAuthorizer());

        // Set tenant context
        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenantValue.create());

        // Create and register mock Cognito service
        mockCognitoService = new MockCognitoService();
        container.registerInstance(CognitoService, mockCognitoService);

        CognitoApiFeature.register(container);
    });

    it("should create admin user in both api-core and Cognito", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        const result = await createAdminUser.execute(adminUsers.userA);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            id: expect.any(String),
            email: adminUsers.userA.email,
            firstName: adminUsers.userA.firstName,
            lastName: adminUsers.userA.lastName
        });

        // Verify user was created in Cognito
        const userExistsInCognito = await mockCognitoService.userExists(adminUsers.userA.email);
        expect(userExistsInCognito).toBe(true);
    });

    it("should fail to create admin user if account already exists in Cognito", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        // Create first user
        const firstResult = await createAdminUser.execute(adminUsers.userA);
        expect(firstResult.isOk()).toBe(true);

        // Try to create user with same email
        const secondResult = await createAdminUser.execute(adminUsers.userA);

        expect(secondResult.isFail()).toBe(true);
        const error = secondResult.error as CognitoCreateUserError;
        expect(error.code).toBe("Cognito/Account/Exists");
        expect(error.data).toEqual({
            email: adminUsers.userA.email
        });
    });

    it("should fail to create admin user if Cognito throws error", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        const cognitoError: Error = {
            name: "CognitoError",
            message: "Cognito service unavailable"
        };
        mockCognitoService.setShouldThrowError(cognitoError);

        const result = await createAdminUser.execute(adminUsers.userA);

        expect(result.isFail()).toBe(true);
        const error = result.error as CognitoCreateUserError;
        expect(error.code).toBe("Cognito/User/Create");
    });

    it("should update admin user in both api-core and Cognito", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const updateAdminUser = container.resolve(UpdateUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Clear any errors from mock
        mockCognitoService.clearError();

        // Update user
        const updatedFirstName = "Updated";
        const updatedLastName = "Admin";
        const updateResult = await updateAdminUser.execute(user.id, {
            firstName: updatedFirstName,
            lastName: updatedLastName
        });

        expect(updateResult.isOk()).toBe(true);
        expect(updateResult.value).toMatchObject({
            id: user.id,
            email: adminUsers.userA.email,
            firstName: updatedFirstName,
            lastName: updatedLastName
        });
    });

    it("should update password in Cognito when password is provided", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const updateAdminUser = container.resolve(UpdateUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Clear any errors from mock
        mockCognitoService.clearError();

        // Spy on setPermanentPassword
        const setPermanentPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");

        // Update password
        const newPassword = "NewSecurePass789!";
        const updateResult = await updateAdminUser.execute(user.id, {
            password: newPassword
        });

        expect(updateResult.isOk()).toBe(true);
        expect(setPermanentPasswordSpy).toHaveBeenCalledWith(user.email, newPassword);
    });

    it("should fail to update admin user if Cognito throws error", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const updateAdminUser = container.resolve(UpdateUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Set mock to throw error on updateUserAttributes
        const cognitoError = new Error("Cognito update failed");
        mockCognitoService.setShouldThrowError(cognitoError);

        // Try to update user
        const updateResult = await updateAdminUser.execute(user.id, {
            firstName: "Updated"
        });

        expect(updateResult.isFail()).toBe(true);
        const error = updateResult.error as CognitoUpdateUserError;
        expect(error.code).toBe("Cognito/User/Update");
    });

    it("should delete admin user from both api-core and Cognito", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const deleteAdminUser = container.resolve(DeleteUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Verify user exists in Cognito
        let userExistsInCognito = await mockCognitoService.userExists(adminUsers.userA.email);
        expect(userExistsInCognito).toBe(true);

        // Clear any errors from mock
        mockCognitoService.clearError();

        // Delete user
        const deleteResult = await deleteAdminUser.execute(user.id);

        expect(deleteResult.isOk()).toBe(true);

        // Verify user was deleted from Cognito
        userExistsInCognito = await mockCognitoService.userExists(adminUsers.userA.email);
        expect(userExistsInCognito).toBe(false);
    });

    it("should fail to delete admin user if Cognito throws error", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const deleteAdminUser = container.resolve(DeleteUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Set mock to throw error on deleteUser
        const cognitoError = new Error("Cognito delete failed");
        mockCognitoService.setShouldThrowError(cognitoError);

        // Try to delete user
        const deleteResult = await deleteAdminUser.execute(user.id);

        expect(deleteResult.isFail()).toBe(true);

        const error = deleteResult.error as CognitoDeleteUserError;
        expect(error.code).toBe("Cognito/User/Delete");
    });

    it("should set email as verified when creating first user", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        // Spy on setEmailVerified
        const setEmailVerifiedSpy = vi.spyOn(mockCognitoService, "setEmailVerified");

        // Create first user
        const result = await createAdminUser.execute(adminUsers.userA);

        expect(result.isOk()).toBe(true);
        expect(setEmailVerifiedSpy).toHaveBeenCalledWith(adminUsers.userA.email);
    });

    it("should set permanent password for first user in the system", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        // Spy on setPermanentPassword
        const setPermanentPasswordSpy = vi.spyOn(mockCognitoService, "setPermanentPassword");

        // Create first user
        const result = await createAdminUser.execute(adminUsers.userA);

        expect(result.isOk()).toBe(true);
        expect(setPermanentPasswordSpy).toHaveBeenCalledWith(
            adminUsers.userA.email,
            adminUsers.userA.password
        );
    });

    it("should call Cognito updateUserAttributes when email changes", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);
        const updateAdminUser = container.resolve(UpdateUserUseCase);

        // Create user
        const createResult = await createAdminUser.execute(adminUsers.userA);
        expect(createResult.isOk()).toBe(true);
        const user = createResult.value!;

        // Clear any errors from mock
        mockCognitoService.clearError();

        // Spy on updateUserAttributes
        const updateUserAttributesSpy = vi.spyOn(mockCognitoService, "updateUserAttributes");

        // Update email
        const newEmail = "new_email@example.com";
        const updateResult = await updateAdminUser.execute(user.id, {
            email: newEmail
        });

        expect(updateResult.isOk()).toBe(true);
        // Verify updateUserAttributes was called with the original username
        expect(updateUserAttributesSpy).toHaveBeenCalledWith(
            adminUsers.userA.email,
            expect.any(Object)
        );
    });

    it("should validate input before creating user", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        // Try to create user with invalid email
        const result = await createAdminUser.execute({
            email: "invalid-email",
            firstName: "Test",
            lastName: "User",
            password: "password123"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("AdminUser/Validation");
    });

    it("should validate password requirements when creating user", async () => {
        const createAdminUser = container.resolve(CreateUserUseCase);

        // Try to create user with short password
        const result = await createAdminUser.execute({
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            password: "short"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error?.code).toBe("AdminUser/Validation");
    });
});
