import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { PasswordResetCodeStorageOperations } from "~/api/storage/passwordResetCodes.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import { PasswordResetCodesRepositoryFeature } from "~/api/repositories/PasswordResetCodesRepository.js";
import { createInMemoryPasswordResetCodes } from "./helpers/inMemoryPasswordResetCodes.js";

/**
 * What the repository is for: a database that is down reaches the caller as a result it can report,
 * not as an exception thrown through a resolver.
 */

const EMAIL = "admin@example.com";

const code: StoredPasswordResetCode = {
    id: "code-1",
    email: EMAIL,
    codeHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    expiresOn: "2090-01-01T00:00:00.000Z",
    usedOn: null,
    attempts: 0
};

const setup = (operations: Partial<PasswordResetCodeStorageOperations.Interface> = {}) => {
    const container = new Container();
    const inMemory = createInMemoryPasswordResetCodes();

    container.registerInstance(PasswordResetCodeStorageOperations, {
        ...inMemory.operations,
        ...operations
    });

    PasswordResetCodesRepositoryFeature.register(container);

    return {
        repository: container.resolve(PasswordResetCodesRepository),
        rows: inMemory.rows
    };
};

const throws = () => {
    throw new Error("the database is on fire");
};

describe("PasswordResetCodesRepository", () => {
    it("stores a code and reads it back as live", async () => {
        const { repository } = setup();

        const issued = await repository.issue({ code });
        expect(issued.isFail()).toBe(false);

        const live = await repository.listLive({ email: EMAIL, now: "2026-06-01T00:00:00.000Z" });

        expect(live.isFail()).toBe(false);
        expect(live.isOk() && live.value).toHaveLength(1);
    });

    it("turns a failing read into a result, not an exception", async () => {
        const { repository } = setup({ countCodesCreatedSince: throws });

        const result = await repository.countRequestsSince({
            email: EMAIL,
            since: "2026-01-01T00:00:00.000Z"
        });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("PASSWORD_RESET_PERSISTENCE_ERROR");
    });

    it("turns a failing write into a result, not an exception", async () => {
        const { repository } = setup({ saveCode: throws });

        const result = await repository.issue({ code });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("PASSWORD_RESET_PERSISTENCE_ERROR");
    });

    it("says nothing about the database in the message it hands back", async () => {
        const { repository } = setup({ saveCode: throws });

        const result = await repository.issue({ code });

        expect(result.isFail() && result.error.message).not.toContain("database");
    });

    /**
     * Clearing out old rows is housekeeping the caller never asked for. Failing it after the code
     * is safely stored would report a reset as broken when it worked.
     */
    it("still reports success when only the housekeeping fails", async () => {
        const deleteCodesExpiredBefore = vi.fn(throws);
        const { repository, rows } = setup({ deleteCodesExpiredBefore });

        const result = await repository.issue({ code });

        expect(result.isFail()).toBe(false);
        expect(deleteCodesExpiredBefore).toHaveBeenCalled();
        expect(rows).toHaveLength(1);
    });

    it("clears out rows nobody can use any more when a code is issued", async () => {
        const deleteCodesExpiredBefore = vi.fn(async () => undefined);
        const { repository } = setup({ deleteCodesExpiredBefore });

        await repository.issue({ code });

        const [params] = deleteCodesExpiredBefore.mock.calls[0] as [{ before: string }];

        // A day back, not "now", so a support question about this morning still has rows to look at.
        expect(new Date(params.before).getTime()).toBeLessThan(Date.now());
    });
});
