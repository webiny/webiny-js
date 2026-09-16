import { describe, expect, it, vi } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { CliResetTokenVerifier } from "~/api/domain/crypto/CliResetTokenVerifier.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import type { StorageCredential } from "~/api/storage/abstractions.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import {
    CliResetPasswordFeature,
    CliResetPasswordUseCase
} from "~/api/features/CliResetPassword/index.js";

const EMAIL = "admin@example.com";

const credential: StorageCredential = {
    userId: "user-123",
    email: EMAIL,
    passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

interface SetupOptions {
    /** What the token verifier makes of the token. `null` means it did not verify. */
    claims?: { email: string } | null;
    credential?: StorageCredential | null;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();

    const setPassword = vi.fn(async () => Result.ok(true as const));
    const getCredentialByEmail = vi.fn(async () => options.credential ?? null);

    container.registerInstance(CliResetTokenVerifier, {
        verify: () => (options.claims === undefined ? { email: EMAIL } : options.claims)
    });

    container.registerInstance(CredentialsStorageOperations, {
        getCredentialByEmail,
        getCredentialByUserId: async () => null,
        saveCredential: async () => undefined,
        deleteCredential: async () => undefined
    });

    container.registerInstance(SetPasswordUseCase, { execute: setPassword });

    CliResetPasswordFeature.register(container);

    return {
        useCase: container.resolve(CliResetPasswordUseCase),
        setPassword,
        getCredentialByEmail
    };
};

describe("CliResetPasswordUseCase", () => {
    it("sets the password for the account named by the token", async () => {
        const { useCase, setPassword } = setup({ credential });

        const result = await useCase.execute({ token: "a-token", password: "long-enough" });

        expect(result.isFail()).toBe(false);
        expect(setPassword).toHaveBeenCalledWith({
            userId: "user-123",
            email: EMAIL,
            password: "long-enough"
        });
    });

    /**
     * The whole authorization story. The request carries a token and a password and nothing else,
     * so the account being changed comes from the verified claims and the stored credential,
     * never from something the caller can vary without re-signing.
     */
    it("takes the user id from the stored credential, not from the request", async () => {
        const { useCase, getCredentialByEmail, setPassword } = setup({ credential });

        await useCase.execute({ token: "a-token", password: "long-enough" });

        expect(getCredentialByEmail).toHaveBeenCalledWith({ email: EMAIL });
        expect(setPassword.mock.calls[0][0]).toMatchObject({ userId: credential.userId });
    });

    it("fails without touching the password when the token does not verify", async () => {
        const { useCase, setPassword, getCredentialByEmail } = setup({ claims: null });

        const result = await useCase.execute({ token: "forged", password: "long-enough" });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("INVALID_RESET_TOKEN");
        expect(getCredentialByEmail).not.toHaveBeenCalled();
        expect(setPassword).not.toHaveBeenCalled();
    });

    it("reports a missing account plainly, since the caller already holds the secret", async () => {
        const { useCase, setPassword } = setup({ credential: null });

        const result = await useCase.execute({ token: "a-token", password: "long-enough" });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("CREDENTIAL_NOT_FOUND_FOR_EMAIL");
        expect(setPassword).not.toHaveBeenCalled();
    });
});
