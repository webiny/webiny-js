import type {
    PasswordResetCodeStorageOperations,
    StoredPasswordResetCode
} from "~/api/storage/passwordResetCodes.js";

export interface InMemoryPasswordResetCodes {
    operations: PasswordResetCodeStorageOperations.Interface;
    rows: StoredPasswordResetCode[];
}

/**
 * The reset code table, in memory. Behaves the way the SQL implementation is specified to: live
 * means neither spent nor expired, newest first, and an attempt is added in place.
 *
 * Worth having rather than a bag of `vi.fn()`s, because the interesting behaviour of both use cases
 * is what happens across several calls, and a stub that forgets what it was told cannot show that a
 * code was spent or that a limit was reached.
 */
export const createInMemoryPasswordResetCodes = (
    seed: StoredPasswordResetCode[] = []
): InMemoryPasswordResetCodes => {
    const rows: StoredPasswordResetCode[] = [...seed];

    const operations: PasswordResetCodeStorageOperations.Interface = {
        async saveCode({ code }) {
            rows.push({ ...code });
        },

        async listLiveCodesByEmail({ email, now }) {
            return rows
                .filter(row => row.email === email)
                .filter(row => row.usedOn === null)
                .filter(row => row.expiresOn > now)
                .sort((a, b) => (a.createdOn < b.createdOn ? 1 : -1));
        },

        async countCodesCreatedSince({ email, since }) {
            return rows.filter(row => row.email === email && row.createdOn >= since).length;
        },

        async incrementAttempts({ id }) {
            const row = rows.find(candidate => candidate.id === id);
            if (row) {
                row.attempts += 1;
            }
        },

        async markCodesUsedForEmail({ email, usedOn }) {
            for (const row of rows) {
                if (row.email === email && row.usedOn === null) {
                    row.usedOn = usedOn;
                }
            }
        },

        async deleteCodesExpiredBefore({ before }) {
            for (let index = rows.length - 1; index >= 0; index--) {
                if (rows[index]!.expiresOn < before) {
                    rows.splice(index, 1);
                }
            }
        }
    };

    return { operations, rows };
};
