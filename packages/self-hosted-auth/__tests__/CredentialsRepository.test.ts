import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import type { StorageCredential } from "~/api/storage/abstractions.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";

const EMAIL = "admin@example.com";

const credential: StorageCredential = {
    userId: "user-123",
    email: EMAIL,
    passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

const throws = () => {
    throw new Error("the database is on fire");
};

const setup = (operations: Partial<CredentialsStorageOperations.Interface> = {}) => {
    const container = new Container();

    container.registerInstance(CredentialsStorageOperations, {
        getCredentialByEmail: async () => credential,
        getCredentialByUserId: async () => credential,
        saveCredential: async () => undefined,
        deleteCredential: async () => undefined,
        ...operations
    });

    CredentialsRepositoryFeature.register(container);

    return container.resolve(CredentialsRepository);
};

describe("CredentialsRepository", () => {
    it("reads a credential back", async () => {
        const result = await setup().getByEmail({ email: EMAIL });

        expect(result.isOk() && result.value).toEqual(credential);
    });

    /**
     * Absence is an ordinary answer, not a failure. Every caller has something specific to do about
     * it, and none of them can do it if "no account" and "database down" arrive the same way.
     */
    it("reports an address with no account as an empty success", async () => {
        const repository = setup({ getCredentialByEmail: async () => null });

        const result = await repository.getByEmail({ email: "nobody@example.com" });

        expect(result.isFail()).toBe(false);
        expect(result.isOk() && result.value).toBeNull();
    });

    it("turns a failing read into a result, not an exception", async () => {
        const repository = setup({ getCredentialByEmail: throws });

        const result = await repository.getByEmail({ email: EMAIL });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
    });

    it("turns a failing write into a result, not an exception", async () => {
        const repository = setup({ saveCredential: throws });

        const result = await repository.save({ credential });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
    });

    it("says nothing about the database in the message it hands back", async () => {
        const repository = setup({ getCredentialByEmail: throws });

        const result = await repository.getByEmail({ email: EMAIL });

        expect(result.isFail() && result.error.message).not.toContain("database");
    });
});
