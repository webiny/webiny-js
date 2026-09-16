import type { Container } from "@webiny/feature/api";
import { SavePasswordResetCodeStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { ListLivePasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { CountPasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { IncrementPasswordResetCodeAttemptsStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { MarkPasswordResetCodesUsedStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import { DeleteExpiredPasswordResetCodesStorageOperation } from "~/api/storage/passwordResetCodes/index.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes/index.js";

/** Stand-ins for any of the six operations, for cases that need one to misbehave. */
export interface PasswordResetCodeOperationOverrides {
    save?: SavePasswordResetCodeStorageOperation.Interface["execute"];
    listLive?: ListLivePasswordResetCodesStorageOperation.Interface["execute"];
    count?: CountPasswordResetCodesStorageOperation.Interface["execute"];
    incrementAttempts?: IncrementPasswordResetCodeAttemptsStorageOperation.Interface["execute"];
    markUsed?: MarkPasswordResetCodesUsedStorageOperation.Interface["execute"];
    deleteExpired?: DeleteExpiredPasswordResetCodesStorageOperation.Interface["execute"];
}

export interface InMemoryPasswordResetCodes {
    /** Registers all six operations against one shared array of rows. */
    register(container: Container): void;
    rows: StoredPasswordResetCode[];
}

/**
 * The reset code table, in memory, registered one operation at a time the way a database package
 * registers them.
 *
 * Worth having rather than a bag of `vi.fn()`s, because the interesting behaviour of both use cases
 * is what happens across several calls, and a stub that forgets what it was told cannot show that a
 * code was spent or that a limit was reached.
 */
export const createInMemoryPasswordResetCodes = (
    seed: StoredPasswordResetCode[] = [],
    overrides: PasswordResetCodeOperationOverrides = {}
): InMemoryPasswordResetCodes => {
    const rows: StoredPasswordResetCode[] = [...seed];

    const save = async (params: { code: StoredPasswordResetCode }) => {
        rows.push({ ...params.code });
    };

    const listLive = async (params: { email: string; now: string }) => {
        return rows
            .filter(row => row.email === params.email)
            .filter(row => row.usedOn === null)
            .filter(row => row.expiresOn > params.now)
            .sort((a, b) => (a.createdOn < b.createdOn ? 1 : -1));
    };

    const count = async (params: { email: string; since: string }) => {
        return rows.filter(row => row.email === params.email && row.createdOn >= params.since)
            .length;
    };

    const incrementAttempts = async (params: { id: string }) => {
        const row = rows.find(candidate => candidate.id === params.id);
        if (row) {
            row.attempts += 1;
        }
    };

    const markUsed = async (params: { email: string; usedOn: string }) => {
        for (const row of rows) {
            if (row.email === params.email && row.usedOn === null) {
                row.usedOn = params.usedOn;
            }
        }
    };

    const deleteExpired = async (params: { before: string }) => {
        for (let index = rows.length - 1; index >= 0; index--) {
            if (rows[index]!.expiresOn < params.before) {
                rows.splice(index, 1);
            }
        }
    };

    return {
        rows,
        register(container: Container) {
            container.registerInstance(SavePasswordResetCodeStorageOperation, {
                execute: overrides.save ?? save
            });
            container.registerInstance(ListLivePasswordResetCodesStorageOperation, {
                execute: overrides.listLive ?? listLive
            });
            container.registerInstance(CountPasswordResetCodesStorageOperation, {
                execute: overrides.count ?? count
            });
            container.registerInstance(IncrementPasswordResetCodeAttemptsStorageOperation, {
                execute: overrides.incrementAttempts ?? incrementAttempts
            });
            container.registerInstance(MarkPasswordResetCodesUsedStorageOperation, {
                execute: overrides.markUsed ?? markUsed
            });
            container.registerInstance(DeleteExpiredPasswordResetCodesStorageOperation, {
                execute: overrides.deleteExpired ?? deleteExpired
            });
        }
    };
};
