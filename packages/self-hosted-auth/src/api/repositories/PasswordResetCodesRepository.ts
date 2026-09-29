import { createAbstraction } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { SavePasswordResetCodeStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { ListLivePasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { CountPasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { IncrementPasswordResetCodeAttemptsStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { MarkPasswordResetCodesUsedStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { DeleteExpiredPasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes/index.js";
import { PasswordResetPersistenceError } from "~/api/domain/errors.js";
import { RESET_CODE_RETENTION_HOURS } from "~/api/domain/passwordResetPolicy.js";

export interface IPasswordResetCodesRepository {
    /** How many codes have been requested for this address since the given time. */
    countRequestsSince(params: {
        email: string;
        since: string;
    }): Promise<Result<number, PasswordResetPersistenceError>>;

    /** Stores a freshly minted code, and clears out rows nobody can use any more. */
    issue(params: {
        code: StoredPasswordResetCode;
    }): Promise<Result<true, PasswordResetPersistenceError>>;

    /** Codes for this address that are neither spent nor expired, newest first. */
    listLive(params: {
        email: string;
        now: string;
    }): Promise<Result<StoredPasswordResetCode[], PasswordResetPersistenceError>>;

    /** Counts one wrong guess against a code. */
    recordFailedAttempt(params: {
        id: string;
    }): Promise<Result<true, PasswordResetPersistenceError>>;

    /** Spends every live code for the address, so an older one in the mailbox stops working. */
    spendAllForEmail(params: {
        email: string;
        usedOn: string;
    }): Promise<Result<true, PasswordResetPersistenceError>>;
}

/**
 * Reset codes, as the use cases want them.
 *
 * Sits between the use cases and the storage operations for the reason every other repository in
 * the codebase does: the use cases get results they can act on rather than exceptions they would
 * have to catch, and the bookkeeping that is nobody's business but the store's (clearing out rows
 * past their retention) happens here rather than in a use case.
 */
export const PasswordResetCodesRepository = createAbstraction<IPasswordResetCodesRepository>(
    "PasswordResetCodesRepository"
);

export namespace PasswordResetCodesRepository {
    export type Interface = IPasswordResetCodesRepository;
    export type Error = PasswordResetPersistenceError;
}

class PasswordResetCodesRepositoryImpl implements IPasswordResetCodesRepository {
    constructor(
        private saveCode: SavePasswordResetCodeStorageOperation.Interface,
        private listLiveCodes: ListLivePasswordResetCodesStorageOperation.Interface,
        private countCodes: CountPasswordResetCodesStorageOperation.Interface,
        private incrementAttempts: IncrementPasswordResetCodeAttemptsStorageOperation.Interface,
        private markUsed: MarkPasswordResetCodesUsedStorageOperation.Interface,
        private deleteExpired: DeleteExpiredPasswordResetCodesStorageOperation.Interface
    ) {}

    async countRequestsSince(params: { email: string; since: string }) {
        try {
            const total = await this.countCodes.execute(params);

            return Result.ok(total);
        } catch {
            return Result.fail(new PasswordResetPersistenceError());
        }
    }

    async issue(params: { code: StoredPasswordResetCode }) {
        try {
            await this.saveCode.execute({ code: params.code });

            // Opportunistic, and only after the write that matters. Housekeeping failing is not a
            // reason to tell a user their reset did not work, so it gets its own catch.
            await this.deleteRowsPastRetention();

            return Result.ok(true as const);
        } catch {
            return Result.fail(new PasswordResetPersistenceError());
        }
    }

    async listLive(params: { email: string; now: string }) {
        try {
            const codes = await this.listLiveCodes.execute(params);

            return Result.ok(codes);
        } catch {
            return Result.fail(new PasswordResetPersistenceError());
        }
    }

    async recordFailedAttempt(params: { id: string }) {
        try {
            await this.incrementAttempts.execute(params);

            return Result.ok(true as const);
        } catch {
            return Result.fail(new PasswordResetPersistenceError());
        }
    }

    async spendAllForEmail(params: { email: string; usedOn: string }) {
        try {
            await this.markUsed.execute(params);

            return Result.ok(true as const);
        } catch {
            return Result.fail(new PasswordResetPersistenceError());
        }
    }

    private async deleteRowsPastRetention() {
        const cutoff = new Date(Date.now() - RESET_CODE_RETENTION_HOURS * 3_600_000);

        try {
            await this.deleteExpired.execute({ before: cutoff.toISOString() });
        } catch {
            // Deliberately swallowed. The code was stored, which is what the caller asked for.
        }
    }
}

const passwordResetCodesRepository = PasswordResetCodesRepository.createImplementation({
    implementation: PasswordResetCodesRepositoryImpl,
    dependencies: [
        SavePasswordResetCodeStorageOperation,
        ListLivePasswordResetCodesStorageOperation,
        CountPasswordResetCodesStorageOperation,
        IncrementPasswordResetCodeAttemptsStorageOperation,
        MarkPasswordResetCodesUsedStorageOperation,
        DeleteExpiredPasswordResetCodesStorageOperation
    ]
});

export const PasswordResetCodesRepositoryFeature = createFeature({
    name: "PasswordResetCodesRepository",
    register(container) {
        container.register(passwordResetCodesRepository);
    }
});
