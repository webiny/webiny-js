/**
 * One issued password reset code.
 *
 * The code itself is never stored, only a hash produced by the same `Hasher` that hashes passwords.
 * Six digits is a million possibilities, so anyone holding a copy of this table and a fast digest
 * would walk the whole space in seconds. The slow KDF is what makes the stored value worthless on
 * its own.
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
