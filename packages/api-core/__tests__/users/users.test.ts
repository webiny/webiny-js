import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { License } from "@webiny/wcp";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { UpdateUserUseCase } from "~/features/users/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/features/users/DeleteUser/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";
import { users } from "~tests/mocks/users.js";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";
import type { SecurityPermission } from "~/types/security.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

class TestAuthorizer implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[] | null> {
        return [{ name: "*" }];
    }
}

describe("Users", function () {
    let container: Container;

    beforeEach(async () => {
        // Create a new container for each test
        container = new Container();

        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const testLicense = License.fromLicenseDto(createTestWcpLicense());

        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense: testLicense });
        container.registerInstance(Authorizer, new TestAuthorizer());

        const tenantContext = container.resolve(TenantContext);
        tenantContext.setTenant(RootTenantValue.create());
    });

    it("should create, read, update and delete users", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const getUser = container.resolve(GetUserUseCase);
        const updateUser = container.resolve(UpdateUserUseCase);
        const deleteUser = container.resolve(DeleteUserUseCase);
        const listUsers = container.resolve(ListUsersUseCase);

        // Create userA
        const createUserAResult = await createUser.execute(users.userA);

        expect(createUserAResult.isOk()).toBe(true);
        expect(createUserAResult.value).toMatchObject({
            id: expect.any(String),
            email: users.userA.email,
            firstName: users.userA.firstName,
            lastName: users.userA.lastName
        });

        const userA = createUserAResult.value!;

        // Create userB
        const createUserBResult = await createUser.execute(users.userB);

        expect(createUserBResult.isOk()).toBe(true);
        expect(createUserBResult.value).toMatchObject({
            id: expect.any(String),
            email: users.userB.email,
            firstName: users.userB.firstName,
            lastName: users.userB.lastName
        });

        const userB = createUserBResult.value!;

        // List users - should contain both users
        const listUsersResult = await listUsers.execute();

        expect(listUsersResult.isOk()).toBe(true);
        expect(listUsersResult.value).toHaveLength(2);
        expect(listUsersResult.value).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: userA.id }),
                expect.objectContaining({ id: userB.id })
            ])
        );

        // Update userB's lastName
        const updatedLastName = "User B";
        const updateUserBResult = await updateUser.execute(userB.id, {
            lastName: updatedLastName
        });

        expect(updateUserBResult.isOk()).toBe(true);
        expect(updateUserBResult.value).toMatchObject({
            ...userB,
            lastName: updatedLastName
        });

        // Delete userB
        const deleteUserBResult = await deleteUser.execute(userB.id);

        expect(deleteUserBResult.isOk()).toBe(true);

        // Try to get userB - should not be found
        const getUserBResult = await getUser.execute({ email: userB.email });

        expect(getUserBResult.isFail()).toBe(true);
        expect(getUserBResult.error?.code).toBe("AdminUser/NotFound");

        // Get userA - should still exist
        const getUserAResult = await getUser.execute({ email: userA.email });

        expect(getUserAResult.isOk()).toBe(true);
        expect(getUserAResult.value).toMatchObject({
            id: userA.id,
            email: userA.email,
            firstName: userA.firstName,
            lastName: userA.lastName
        });
    });

    it("should not allow creating a user if email is taken", async () => {
        const createUser = container.resolve(CreateUserUseCase);

        // Create first user
        const createUserAResult = await createUser.execute(users.userA);
        expect(createUserAResult.isOk()).toBe(true);

        // Try to create another user with the same email
        const createDuplicateResult = await createUser.execute(users.userA);

        expect(createDuplicateResult.isFail()).toBe(true);
        expect(createDuplicateResult.error?.code).toBe("AdminUser/EmailTaken");
        expect(createDuplicateResult.error?.data).toEqual({
            email: users.userA.email
        });
    });

    it("should not allow updating user with an existing email", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const updateUser = container.resolve(UpdateUserUseCase);

        // Create userA
        const createUserAResult = await createUser.execute(users.userA);
        expect(createUserAResult.isOk()).toBe(true);
        const userA = createUserAResult.value!;

        // Create userB
        const createUserBResult = await createUser.execute(users.userB);
        expect(createUserBResult.isOk()).toBe(true);
        const userB = createUserBResult.value!;

        // Try to update userB with userA's email
        const updateUserBResult = await updateUser.execute(userB.id, {
            email: userA.email
        });

        expect(updateUserBResult.isFail()).toBe(true);
        expect(updateUserBResult.error?.code).toBe("AdminUser/EmailTaken");
    });

    it("should get user by id", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const getUser = container.resolve(GetUserUseCase);

        // Create user
        const createUserResult = await createUser.execute(users.userA);
        expect(createUserResult.isOk()).toBe(true);
        const user = createUserResult.value!;

        // Get user by id
        const getUserResult = await getUser.execute({ id: user.id });

        expect(getUserResult.isOk()).toBe(true);
        expect(getUserResult.value).toMatchObject({
            id: user.id,
            email: users.userA.email,
            firstName: users.userA.firstName,
            lastName: users.userA.lastName
        });
    });

    it("should get user by email", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const getUser = container.resolve(GetUserUseCase);

        // Create user
        const createUserResult = await createUser.execute(users.userA);
        expect(createUserResult.isOk()).toBe(true);

        // Get user by email
        const getUserResult = await getUser.execute({ email: users.userA.email });

        expect(getUserResult.isOk()).toBe(true);
        expect(getUserResult.value).toMatchObject({
            id: expect.any(String),
            email: users.userA.email,
            firstName: users.userA.firstName,
            lastName: users.userA.lastName
        });
    });

    it("should return error when getting non-existent user", async () => {
        const getUser = container.resolve(GetUserUseCase);

        // Try to get non-existent user
        const getUserResult = await getUser.execute({ email: "nonexistent@example.com" });

        expect(getUserResult.isFail()).toBe(true);
        expect(getUserResult.error?.code).toBe("AdminUser/NotFound");
    });

    it("should update user fields", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const updateUser = container.resolve(UpdateUserUseCase);
        const getUser = container.resolve(GetUserUseCase);

        // Create user
        const createUserResult = await createUser.execute(users.userA);
        expect(createUserResult.isOk()).toBe(true);
        const user = createUserResult.value!;

        // Update multiple fields
        const updateUserResult = await updateUser.execute(user.id, {
            firstName: "Updated First",
            lastName: "Updated Last"
        });

        expect(updateUserResult.isOk()).toBe(true);
        expect(updateUserResult.value).toMatchObject({
            id: user.id,
            email: users.userA.email,
            firstName: "Updated First",
            lastName: "Updated Last"
        });

        // Verify update persisted
        const getUserResult = await getUser.execute({ id: user.id });
        expect(getUserResult.isOk()).toBe(true);
        expect(getUserResult.value).toMatchObject({
            firstName: "Updated First",
            lastName: "Updated Last"
        });
    });

    it("should return empty list when no users exist", async () => {
        const listUsers = container.resolve(ListUsersUseCase);

        const listUsersResult = await listUsers.execute();

        expect(listUsersResult.isOk()).toBe(true);
        expect(listUsersResult.value).toEqual([]);
    });
});
