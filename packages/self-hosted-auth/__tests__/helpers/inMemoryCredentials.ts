import type { Container } from "@webiny/feature/api";
import { GetCredentialByEmailStorageOperation } from "~/api/storage/credentials/index.js";
import { GetCredentialByUserIdStorageOperation } from "~/api/storage/credentials/index.js";
import { SaveCredentialStorageOperation } from "~/api/storage/credentials/index.js";
import { DeleteCredentialStorageOperation } from "~/api/storage/credentials/index.js";
import type { StorageCredential } from "~/api/storage/credentials/index.js";

/** Stand-ins for any of the four operations, for cases that need one to misbehave. */
export interface CredentialOperationOverrides {
    getByEmail?: GetCredentialByEmailStorageOperation.Interface["execute"];
    getByUserId?: GetCredentialByUserIdStorageOperation.Interface["execute"];
    save?: SaveCredentialStorageOperation.Interface["execute"];
    delete?: DeleteCredentialStorageOperation.Interface["execute"];
}

/**
 * The credentials table, in memory, registered one operation at a time. Seeded with whatever a case
 * needs to exist; an empty seed is an installation with no accounts.
 */
export const createInMemoryCredentials = (
    seed: StorageCredential[] = [],
    overrides: CredentialOperationOverrides = {}
) => {
    const rows: StorageCredential[] = [...seed];

    const getByEmail = async (params: { email: string }) => {
        return rows.find(row => row.email === params.email) ?? null;
    };

    const getByUserId = async (params: { userId: string }) => {
        return rows.find(row => row.userId === params.userId) ?? null;
    };

    const save = async (params: { credential: StorageCredential }) => {
        const index = rows.findIndex(row => row.userId === params.credential.userId);
        if (index === -1) {
            rows.push({ ...params.credential });
            return;
        }

        rows[index] = { ...params.credential };
    };

    const remove = async (params: { userId: string }) => {
        const index = rows.findIndex(row => row.userId === params.userId);
        if (index > -1) {
            rows.splice(index, 1);
        }
    };

    return {
        rows,
        register(container: Container) {
            container.registerInstance(GetCredentialByEmailStorageOperation, {
                execute: overrides.getByEmail ?? getByEmail
            });
            container.registerInstance(GetCredentialByUserIdStorageOperation, {
                execute: overrides.getByUserId ?? getByUserId
            });
            container.registerInstance(SaveCredentialStorageOperation, {
                execute: overrides.save ?? save
            });
            container.registerInstance(DeleteCredentialStorageOperation, {
                execute: overrides.delete ?? remove
            });
        }
    };
};
