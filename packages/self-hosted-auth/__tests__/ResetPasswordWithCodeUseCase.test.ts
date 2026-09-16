import { describe, expect, it, vi } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { CredentialsStorageOperations } from "~/api/storage/abstractions.js";
import type { StorageCredential } from "~/api/storage/abstractions.js";
import { PasswordResetCodeStorageOperations } from "~/api/storage/passwordResetCodes.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes.js";
import { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";
import { WeakPasswordError } from "~/api/domain/errors.js";
import { RESET_CODE_MAX_ATTEMPTS } from "~/api/domain/passwordResetPolicy.js";
import {
    ResetPasswordWithCodeFeature,
    ResetPasswordWithCodeUseCase
} from "~/api/features/ResetPasswordWithCode/index.js";
import { createInMemoryPasswordResetCodes } from "./helpers/inMemoryPasswordResetCodes.js";

const EMAIL = "admin@example.com";
const CODE = "424242";
const PASSWORD = "long-enough-password";

const credential: StorageCredential = {
    userId: "user-123",
    email: EMAIL,
    passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

const anHourFromNow = () => new Date(Date.now() + 3_600_000).toISOString();
const anHourAgo = () => new Date(Date.now() - 3_600_000).toISOString();

const storedCode = (overrides: Partial<StoredPasswordResetCode> = {}): StoredPasswordResetCode => ({
    id: "code-1",
    email: EMAIL,
    codeHash: `hashed:${CODE}`,
    createdOn: new Date().toISOString(),
    expiresOn: anHourFromNow(),
    usedOn: null,
    attempts: 0,
    ...overrides
});

interface SetupOptions {
    rows?: StoredPasswordResetCode[];
    credential?: StorageCredential | null;
    setPasswordFails?: boolean;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();

    const codes = createInMemoryPasswordResetCodes(options.rows ?? [storedCode()]);

    const setPassword = vi.fn(async () => {
        if (options.setPasswordFails) {
            return Result.fail(new WeakPasswordError("Password must be at least 8 characters."));
        }
        return Result.ok(true as const);
    });

    container.registerInstance(PasswordResetCodeStorageOperations, codes.operations);

    container.registerInstance(CredentialsStorageOperations, {
        getCredentialByEmail: async () =>
            options.credential === undefined ? credential : options.credential,
        getCredentialByUserId: async () => null,
        saveCredential: async () => undefined,
        deleteCredential: async () => undefined
    });

    container.registerInstance(Hasher, {
        hash: async (value: string) => `hashed:${value}`,
        verify: async (value: string, storedHash: string) => `hashed:${value}` === storedHash
    });

    container.registerInstance(SetPasswordUseCase, { execute: setPassword });

    ResetPasswordWithCodeFeature.register(container);

    return {
        useCase: container.resolve(ResetPasswordWithCodeUseCase),
        codes,
        setPassword
    };
};

describe("ResetPasswordWithCodeUseCase", () => {
    it("sets the password when the code checks out", async () => {
        const { useCase, setPassword } = setup();

        const result = await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(result.isFail()).toBe(false);
        expect(setPassword).toHaveBeenCalledWith({
            userId: "user-123",
            email: EMAIL,
            password: PASSWORD
        });
    });

    /**
     * The account comes from the stored credential, not from anything the caller can vary. A code
     * is authority over one account and must not be aimable at another.
     */
    it("takes the user id from the stored credential, not from the request", async () => {
        const { useCase, setPassword } = setup();

        await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(setPassword.mock.calls[0]![0]).toMatchObject({ userId: credential.userId });
    });

    it("refuses a wrong code", async () => {
        const { useCase, setPassword } = setup();

        const result = await useCase.execute({ email: EMAIL, code: "000000", password: PASSWORD });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("INVALID_RESET_CODE");
        expect(setPassword).not.toHaveBeenCalled();
    });

    it("counts a wrong guess against the code", async () => {
        const { useCase, codes } = setup();

        await useCase.execute({ email: EMAIL, code: "000000", password: PASSWORD });

        expect(codes.rows[0]!.attempts).toBe(1);
    });

    /**
     * The test that matters most here. Six digits is a million possibilities, which is no obstacle
     * at all to a script, so the code is not protected by being hard to guess. It is protected by
     * dying after a few wrong ones.
     */
    it("kills the code once the guesses run out, even with the right code after", async () => {
        const { useCase } = setup();

        for (let guess = 0; guess < RESET_CODE_MAX_ATTEMPTS; guess++) {
            await useCase.execute({ email: EMAIL, code: "000000", password: PASSWORD });
        }

        const withTheRightCode = await useCase.execute({
            email: EMAIL,
            code: CODE,
            password: PASSWORD
        });

        expect(withTheRightCode.isFail()).toBe(true);
        expect(withTheRightCode.isFail() && withTheRightCode.error.code).toBe("INVALID_RESET_CODE");
    });

    it("refuses a code that has already been spent", async () => {
        const { useCase } = setup();

        const first = await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });
        const second = await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(first.isFail()).toBe(false);
        expect(second.isFail()).toBe(true);
        expect(second.isFail() && second.error.code).toBe("INVALID_RESET_CODE");
    });

    /**
     * A user who asked twice has two codes in their mailbox. Spending one has to retire the other,
     * or the older message stays a way in long after the reset is done.
     */
    it("retires every other outstanding code for the address", async () => {
        const older = storedCode({ id: "code-older", codeHash: "hashed:111111" });
        const newer = storedCode({ id: "code-newer" });

        const { useCase, codes } = setup({ rows: [older, newer] });

        await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(codes.rows.every(row => row.usedOn !== null)).toBe(true);

        const withTheOlderCode = await useCase.execute({
            email: EMAIL,
            code: "111111",
            password: PASSWORD
        });

        expect(withTheOlderCode.isFail()).toBe(true);
    });

    it("refuses an expired code", async () => {
        const { useCase } = setup({ rows: [storedCode({ expiresOn: anHourAgo() })] });

        const result = await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("INVALID_RESET_CODE");
    });

    it("reports an expired code exactly as it reports a wrong one", async () => {
        const expired = await setup({
            rows: [storedCode({ expiresOn: anHourAgo() })]
        }).useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        const wrong = await setup().useCase.execute({
            email: EMAIL,
            code: "000000",
            password: PASSWORD
        });

        expect(expired.isFail() && expired.error.code).toBe(wrong.isFail() && wrong.error.code);
        expect(expired.isFail() && expired.error.message).toBe(
            wrong.isFail() && wrong.error.message
        );
    });

    it("refuses a code issued for an address with no account", async () => {
        const { useCase, setPassword } = setup({ credential: null });

        const result = await useCase.execute({ email: EMAIL, code: CODE, password: PASSWORD });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("INVALID_RESET_CODE");
        expect(setPassword).not.toHaveBeenCalled();
    });

    /**
     * The code was right and the password was not, so the user should be able to pick a better one
     * without going back to their inbox for a new code.
     */
    it("leaves the code alive when the new password is rejected", async () => {
        const { useCase, codes } = setup({ setPasswordFails: true });

        const rejected = await useCase.execute({ email: EMAIL, code: CODE, password: "short" });

        expect(rejected.isFail()).toBe(true);
        expect(rejected.isFail() && rejected.error.code).toBe("WEAK_PASSWORD");
        expect(codes.rows[0]!.usedOn).toBeNull();
    });

    it("matches the code whatever capitals the address is typed with", async () => {
        const { useCase } = setup();

        const result = await useCase.execute({
            email: EMAIL.toUpperCase(),
            code: CODE,
            password: PASSWORD
        });

        expect(result.isFail()).toBe(false);
    });
});
