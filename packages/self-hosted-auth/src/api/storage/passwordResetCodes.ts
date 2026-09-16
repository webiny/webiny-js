import { createAbstraction } from "@webiny/feature/api";

/**
 * One issued password reset code.
 *
 * The code itself is never stored, only a hash produced by the same `Hasher` that hashes passwords.
 * Six digits is a million possibilities, so anyone holding a copy of this table and a fast digest
 * would walk the whole space in seconds. The slow KDF is what makes the stored value worthless on
 * its own.
 *
 * A row is written for every request, including requests naming an address with no account. That is
 * not bookkeeping for its own sake: the request limit counts these rows, and a limit that only
 * counted real accounts would answer differently for an address that exists, which is exactly the
 * question the identical responses are there to refuse.
 */
export interface StoredPasswordResetCode {
    id: string;
    /** The address the code was requested for, whether or not an account exists for it. */
    email: string;
    codeHash: string;
    createdOn: string;
    expiresOn: string;
    /** Set when the code is spent, or when a later request supersedes it. Never unset. */
    usedOn: string | null;
    /** Failed verifications so far. The code dies once this reaches the cap. */
    attempts: number;
}

export interface IPasswordResetCodeStorageOperations {
    saveCode(params: { code: StoredPasswordResetCode }): Promise<void>;

    /**
     * Codes for this address that are neither spent nor expired, newest first. Normally one, but a
     * request that raced with another can leave two, and both have to be checked.
     */
    listLiveCodesByEmail(params: {
        email: string;
        now: string;
    }): Promise<StoredPasswordResetCode[]>;

    /** How many codes have been requested for this address since the given time. */
    countCodesCreatedSince(params: { email: string; since: string }): Promise<number>;

    /**
     * Adds one to a code's failed verification count. Atomic where the database can do it, because
     * two wrong guesses arriving together must not both read the same count and write it back.
     */
    incrementAttempts(params: { id: string }): Promise<void>;

    /**
     * Marks every live code for the address as spent. Used on a successful reset, so that an older
     * code still sitting in the mailbox is worth nothing afterwards.
     */
    markCodesUsedForEmail(params: { email: string; usedOn: string }): Promise<void>;

    /** Drops rows that are spent or long expired. Called opportunistically, not on a schedule. */
    deleteCodesExpiredBefore(params: { before: string }): Promise<void>;
}

/**
 * Persistence seam for reset codes. Separate from `CredentialsStorageOperations` on purpose: a
 * credential lives as long as the account and a code lives for fifteen minutes, so they differ in
 * table, in lifetime, and in what would make either of them change.
 *
 * Database-agnostic, like the credentials seam. Each database ships a thin implementation
 * (`@webiny/self-hosted-auth-sql`, `-mdb`, …).
 */
export const PasswordResetCodeStorageOperations =
    createAbstraction<IPasswordResetCodeStorageOperations>("PasswordResetCodeStorageOperations");

export namespace PasswordResetCodeStorageOperations {
    export type Interface = IPasswordResetCodeStorageOperations;
    export type Code = StoredPasswordResetCode;
}
