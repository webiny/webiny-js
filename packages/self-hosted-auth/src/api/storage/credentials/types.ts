/**
 * A single stored credential. Kept in a table separate from admin users so that password material
 * never rides along on user reads.
 *
 * Credentials are global (keyed by `userId`, with `email` as the unique login key) — the same model
 * as Cognito's user pool. A user's tenant membership lives in the security layer (roles/teams), not
 * here, so credentials carry no tenant.
 */
export interface StorageCredential {
    userId: string;
    email: string;
    /**
     * Opaque, self-describing hash string produced by a `Hasher`
     * (e.g. `scrypt$16384$8$1$<salt>$<hash>`). The algorithm is encoded in the
     * value, so swapping hashers later does not require a migration.
     */
    passwordHash: string;
    createdOn: string;
    updatedOn: string;
}
