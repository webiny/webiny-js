import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import type { StorageCredential } from "~/api/storage/abstractions.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";
import { TokenIssuer } from "~/api/domain/crypto/TokenIssuer.js";
import { LoginFeature } from "~/api/features/Login/index.js";
import { LoginUseCase } from "~/api/features/Login/index.js";

const EMAIL = "admin@example.com";
const PASSWORD = "long-enough-password";

const credential: StorageCredential = {
    userId: "user-123",
    email: EMAIL,
    passwordHash: `hashed:${PASSWORD}`,
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

const setup = (
    options: { getCredentialByEmail?: () => Promise<StorageCredential | null> } = {}
) => {
    const container = new Container();

    const verify = vi.fn(
        async (value: string, storedHash: string) => `hashed:${value}` === storedHash
    );

    container.registerInstance(CredentialsStorageOperations, {
        getCredentialByEmail: options.getCredentialByEmail ?? (async () => credential),
        getCredentialByUserId: async () => null,
        saveCredential: async () => undefined,
        deleteCredential: async () => undefined
    });

    CredentialsRepositoryFeature.register(container);

    container.registerInstance(Hasher, {
        hash: async (value: string) => `hashed:${value}`,
        verify
    });

    container.registerInstance(TokenIssuer, {
        issue: async () => ({ token: "a-jwt", expiresIn: 3600 }),
        verify: async () => null
    });

    LoginFeature.register(container);

    return { useCase: container.resolve(LoginUseCase), verify };
};

describe("LoginUseCase", () => {
    it("issues a token for the right password", async () => {
        const { useCase } = setup();

        const result = await useCase.execute({ email: EMAIL, password: PASSWORD });

        expect(result.isOk() && result.value.token).toBe("a-jwt");
    });

    it("refuses the wrong password without saying why", async () => {
        const { useCase } = setup();

        const result = await useCase.execute({ email: EMAIL, password: "wrong-password" });

        expect(result.isFail() && result.error.code).toBe("INVALID_CREDENTIALS");
    });

    /**
     * The anti-enumeration step: an unknown address still spends a hash, so the two paths take
     * about the same time and the response cannot be timed to learn which addresses are registered.
     */
    it("spends a hash on an unknown address too, and reports the same error", async () => {
        const { useCase, verify } = setup({ getCredentialByEmail: async () => null });

        const result = await useCase.execute({ email: "nobody@example.com", password: PASSWORD });

        expect(result.isFail() && result.error.code).toBe("INVALID_CREDENTIALS");
        expect(verify).toHaveBeenCalledOnce();
    });

    /**
     * A store that is down is not a wrong password, and saying so would send a user off hunting for
     * a password that was fine. It arrives as its own error now that the repository maps it.
     */
    it("reports a broken credential store as itself, not as bad credentials", async () => {
        const { useCase } = setup({
            getCredentialByEmail: async () => {
                throw new Error("the database is on fire");
            }
        });

        const result = await useCase.execute({ email: EMAIL, password: PASSWORD });

        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
    });
});
