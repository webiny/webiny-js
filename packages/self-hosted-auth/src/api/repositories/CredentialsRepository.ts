import { createAbstraction } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetCredentialByEmailStorageOperation } from "~/api/storage/credentials/index.js";
import { GetCredentialByUserIdStorageOperation } from "~/api/storage/credentials/index.js";
import { SaveCredentialStorageOperation } from "~/api/storage/credentials/index.js";
import { DeleteCredentialStorageOperation } from "~/api/storage/credentials/index.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { CredentialsPersistenceError } from "~/api/domain/errors.js";
import { normalizeEmail } from "~/api/domain/normalizeEmail.js";

export interface ICredentialsRepository {
    /**
     * The credential for this address, or `null` when there is none.
     *
     * Absence is an ordinary answer here, not a failure, which is why this returns `null` rather
     * than failing the way `ApiKeysRepository.get` does. Every caller has something specific to do
     * about it: login spends a hash anyway so the timing does not give the account away, and the
     * reset flow carries on silently so the response does not either.
     */
    getByEmail(params: {
        email: string;
    }): Promise<Result<StorageCredential | null, CredentialsPersistenceError>>;

    getByUserId(params: {
        userId: string;
    }): Promise<Result<StorageCredential | null, CredentialsPersistenceError>>;

    save(params: {
        credential: StorageCredential;
    }): Promise<Result<true, CredentialsPersistenceError>>;

    delete(params: { userId: string }): Promise<Result<true, CredentialsPersistenceError>>;
}

/**
 * Credentials, as the use cases want them: results they can act on rather than exceptions they
 * would have to catch. Sits between them and `CredentialsStorageOperations`, which stays the seam a
 * database package implements.
 */
export const CredentialsRepository =
    createAbstraction<ICredentialsRepository>("CredentialsRepository");

export namespace CredentialsRepository {
    export type Interface = ICredentialsRepository;
    export type Error = CredentialsPersistenceError;
}

class CredentialsRepositoryImpl implements ICredentialsRepository {
    constructor(
        private getByEmailOperation: GetCredentialByEmailStorageOperation.Interface,
        private getByUserIdOperation: GetCredentialByUserIdStorageOperation.Interface,
        private saveOperation: SaveCredentialStorageOperation.Interface,
        private deleteOperation: DeleteCredentialStorageOperation.Interface
    ) {}

    async getByEmail(params: { email: string }) {
        // Every lookup and every write normalizes here, so no caller can store or ask for a variant.
        const email = normalizeEmail(params.email);

        try {
            const credential = await this.getByEmailOperation.execute({ email });

            return Result.ok(credential);
        } catch {
            return Result.fail(new CredentialsPersistenceError());
        }
    }

    async getByUserId(params: { userId: string }) {
        try {
            const credential = await this.getByUserIdOperation.execute(params);

            return Result.ok(credential);
        } catch {
            return Result.fail(new CredentialsPersistenceError());
        }
    }

    async save(params: { credential: StorageCredential }) {
        const email = normalizeEmail(params.credential.email);
        const credential = { ...params.credential, email };

        try {
            await this.saveOperation.execute({ credential });

            return Result.ok(true as const);
        } catch {
            return Result.fail(new CredentialsPersistenceError());
        }
    }

    async delete(params: { userId: string }) {
        try {
            await this.deleteOperation.execute(params);

            return Result.ok(true as const);
        } catch {
            return Result.fail(new CredentialsPersistenceError());
        }
    }
}

const credentialsRepository = CredentialsRepository.createImplementation({
    implementation: CredentialsRepositoryImpl,
    dependencies: [
        GetCredentialByEmailStorageOperation,
        GetCredentialByUserIdStorageOperation,
        SaveCredentialStorageOperation,
        DeleteCredentialStorageOperation
    ]
});

export const CredentialsRepositoryFeature = createFeature({
    name: "CredentialsRepository",
    register(container) {
        container.register(credentialsRepository);
    }
});
