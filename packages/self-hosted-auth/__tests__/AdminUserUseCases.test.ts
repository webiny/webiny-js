import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";
import { SetPasswordFeature } from "~/api/features/SetPassword/index.js";
import { DeleteCredentialFeature } from "~/api/features/DeleteCredential/index.js";
import { CreateAdminUserFeature } from "~/api/features/CreateAdminUser/index.js";
import { CreateAdminUserUseCase } from "~/api/features/CreateAdminUser/index.js";
import { UpdateAdminUserFeature } from "~/api/features/UpdateAdminUser/index.js";
import { UpdateAdminUserUseCase } from "~/api/features/UpdateAdminUser/index.js";
import { DeleteAdminUserFeature } from "~/api/features/DeleteAdminUser/index.js";
import { DeleteAdminUserUseCase } from "~/api/features/DeleteAdminUser/index.js";
import { createInMemoryCredentials } from "./helpers/inMemoryCredentials.js";
import type { CredentialOperationOverrides } from "./helpers/inMemoryCredentials.js";
import { createInMemoryAdminUsers } from "./helpers/inMemoryAdminUsers.js";
import type { InMemoryAdminUsersOptions } from "./helpers/inMemoryAdminUsers.js";

const failing = () => {
    throw new Error("the database is on fire");
};

const jane = {
    id: "jane",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    displayName: "Jane Doe"
} as AdminUser;

const janeCredential: StorageCredential = {
    userId: "jane",
    email: "jane@example.com",
    passwordHash: "hashed:jane-password",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

/** Holds an address in another tenant: no user here, but the credential is global. */
const elsewhereCredential: StorageCredential = {
    userId: "someone-in-another-tenant",
    email: "taken@example.com",
    passwordHash: "hashed:whatever",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

interface SetupOptions extends InMemoryAdminUsersOptions {
    users?: AdminUser[];
    credentials?: StorageCredential[];
    credentialOverrides?: CredentialOperationOverrides;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();

    const users = createInMemoryAdminUsers(options.users ?? [jane], options);
    users.register(container);

    const credentials = createInMemoryCredentials(
        options.credentials ?? [janeCredential, elsewhereCredential],
        options.credentialOverrides
    );
    credentials.register(container);

    container.registerInstance(Hasher, {
        hash: async (value: string) => `hashed:${value}`,
        verify: async (value: string, storedHash: string) => `hashed:${value}` === storedHash
    });

    CredentialsRepositoryFeature.register(container);
    SetPasswordFeature.register(container);
    DeleteCredentialFeature.register(container);
    CreateAdminUserFeature.register(container);
    UpdateAdminUserFeature.register(container);
    DeleteAdminUserFeature.register(container);

    return {
        create: container.resolve(CreateAdminUserUseCase),
        update: container.resolve(UpdateAdminUserUseCase),
        remove: container.resolve(DeleteAdminUserUseCase),
        users: users.rows,
        credentials: credentials.rows
    };
};

const newUser = {
    email: "new@example.com",
    firstName: "New",
    lastName: "User",
    password: "new-user-password"
};

describe("CreateAdminUserUseCase", () => {
    it("creates the user and stores a password it can sign in with", async () => {
        const { create, users, credentials } = setup();

        const result = await create.execute(newUser);

        expect(result.isOk()).toBe(true);
        const user = result.isOk() ? result.value : null;
        expect(users.find(row => row.email === newUser.email)).toBeTruthy();
        expect(credentials.find(row => row.userId === user?.id)).toMatchObject({
            email: newUser.email,
            passwordHash: "hashed:new-user-password"
        });
    });

    it("refuses a caller without the users permission", async () => {
        const { create, users, credentials } = setup({ canManageUsers: false });

        const result = await create.execute(newUser);

        expect(result.isFail() && result.error.code).toBe("AdminUser/NotAuthorized");
        expect(users).toHaveLength(1);
        expect(credentials).toHaveLength(2);
    });

    it("refuses a short password before anything is written", async () => {
        const { create, users } = setup();

        const result = await create.execute({ ...newUser, password: "short" });

        expect(result.isFail() && result.error.code).toBe("AdminUser/Validation");
        expect(users).toHaveLength(1);
    });

    it("refuses an address another tenant's user already signs in with", async () => {
        const { create, users } = setup();

        const result = await create.execute({ ...newUser, email: elsewhereCredential.email });

        expect(result.isFail() && result.error.code).toBe("ACCOUNT_EXISTS");
        expect(users).toHaveLength(1);
    });

    it("treats an address that differs only in case as taken", async () => {
        const { create, users } = setup();

        const result = await create.execute({ ...newUser, email: "Jane@Example.com" });

        expect(result.isFail() && result.error.code).toBe("ACCOUNT_EXISTS");
        expect(users).toHaveLength(1);
    });

    it("removes the user again when its password cannot be stored", async () => {
        const { create, users } = setup({ credentialOverrides: { save: failing } });

        const result = await create.execute(newUser);

        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
        expect(users.map(row => row.id)).toEqual(["jane"]);
    });
});

describe("UpdateAdminUserUseCase", () => {
    it("replaces the password", async () => {
        const { update, credentials } = setup();

        const result = await update.execute("jane", { password: "a-brand-new-password" });

        expect(result.isOk()).toBe(true);
        expect(credentials.find(row => row.userId === "jane")?.passwordHash).toBe(
            "hashed:a-brand-new-password"
        );
    });

    it("keeps the password when the field comes back empty or null", async () => {
        const { update, credentials } = setup();

        const cleared = await update.execute("jane", { firstName: "Janet", password: "" });
        const nulled = await update.execute("jane", {
            firstName: "Janet",
            password: null as unknown as string
        });

        expect(cleared.isOk()).toBe(true);
        expect(nulled.isOk()).toBe(true);
        expect(credentials.find(row => row.userId === "jane")?.passwordHash).toBe(
            janeCredential.passwordHash
        );
    });

    it("leaves the credential alone when neither email nor password changes", async () => {
        const { update, credentials } = setup();

        const result = await update.execute("jane", { firstName: "Janet" });

        expect(result.isOk() && result.value.firstName).toBe("Janet");
        expect(credentials.find(row => row.userId === "jane")).toEqual(janeCredential);
    });

    it("refuses an email change and saves nothing", async () => {
        const { update, users, credentials } = setup();

        const result = await update.execute("jane", {
            firstName: "Janet",
            email: "jane.doe@example.com"
        });

        expect(result.isFail() && result.error.code).toBe("AdminUser/Validation");
        expect(users.find(row => row.id === "jane")).toMatchObject({
            firstName: "Jane",
            email: jane.email
        });
        expect(credentials.find(row => row.userId === "jane")).toEqual(janeCredential);
    });

    it("accepts the current email sent back unchanged", async () => {
        const { update } = setup();

        const result = await update.execute("jane", { firstName: "Janet", email: jane.email });

        expect(result.isOk() && result.value.firstName).toBe("Janet");
    });

    it("refuses a caller without the users permission", async () => {
        const { update, credentials } = setup({ canManageUsers: false });

        const result = await update.execute("jane", { password: "a-brand-new-password" });

        expect(result.isFail() && result.error.code).toBe("AdminUser/NotAuthorized");
        expect(credentials.find(row => row.userId === "jane")).toEqual(janeCredential);
    });
});

describe("DeleteAdminUserUseCase", () => {
    it("removes the user and its credential", async () => {
        const { remove, users, credentials } = setup();

        const result = await remove.execute("jane");

        expect(result.isOk()).toBe(true);
        expect(users).toHaveLength(0);
        expect(credentials.find(row => row.userId === "jane")).toBeUndefined();
    });

    it("refuses to delete the caller's own account, password included", async () => {
        const { remove, users, credentials } = setup({ identityId: "jane" });

        const result = await remove.execute("jane");

        expect(result.isFail() && result.error.code).toBe("CANNOT_DELETE_OWN_ACCOUNT");
        expect(users).toHaveLength(1);
        expect(credentials.find(row => row.userId === "jane")).toEqual(janeCredential);
    });

    it("leaves another tenant's credential alone", async () => {
        const { remove, credentials } = setup();

        const result = await remove.execute(elsewhereCredential.userId);

        expect(result.isFail() && result.error.code).toBe("AdminUser/NotFound");
        expect(credentials).toContainEqual(elsewhereCredential);
    });

    it("keeps the user when its credential cannot be removed", async () => {
        const { remove, users } = setup({ credentialOverrides: { delete: failing } });

        const result = await remove.execute("jane");

        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
        expect(users).toHaveLength(1);
    });

    it("refuses a caller without the users permission", async () => {
        const { remove, credentials } = setup({ canManageUsers: false });

        const result = await remove.execute("jane");

        expect(result.isFail() && result.error.code).toBe("AdminUser/NotAuthorized");
        expect(credentials).toHaveLength(2);
    });
});
