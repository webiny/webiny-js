import { createAbstraction } from "@webiny/feature/api";

/**
 * A single stored credential. Kept in a table separate from admin users so that
 * password material never rides along on user reads.
 *
 * `email` is the login key. See the tenancy note in `LoginUseCase` for why the
 * credential is currently resolved by email alone.
 */
export interface StorageCredential {
    tenant: string;
    userId: string;
    email: string;
    /**
     * Opaque, self-describing hash string produced by a `PasswordHasher`
     * (e.g. `scrypt$16384$8$1$<salt>$<hash>`). The algorithm is encoded in the
     * value, so swapping hashers later does not require a migration.
     */
    passwordHash: string;
    createdOn: string;
    updatedOn: string;
}

export interface GetCredentialByEmailParams {
    email: string;
}

export interface GetCredentialByUserIdParams {
    tenant: string;
    userId: string;
}

export interface ICredentialsStorageOperations {
    getCredentialByEmail(params: GetCredentialByEmailParams): Promise<StorageCredential | null>;
    getCredentialByUserId(params: GetCredentialByUserIdParams): Promise<StorageCredential | null>;
    /** Upsert — create if absent, replace otherwise. */
    saveCredential(params: { credential: StorageCredential }): Promise<void>;
    deleteCredential(params: GetCredentialByUserIdParams): Promise<void>;
}

/**
 * Persistence seam for credentials. Database-agnostic on purpose: each database
 * ships a thin implementation (`@webiny/self-hosted-auth-sql`, `-mdb`, …).
 */
export const CredentialsStorageOperations = createAbstraction<ICredentialsStorageOperations>(
    "CredentialsStorageOperations"
);

export namespace CredentialsStorageOperations {
    export type Interface = ICredentialsStorageOperations;
    export type Credential = StorageCredential;
}
