import { createAbstraction } from "@webiny/feature/api";
import type { StorageCredential } from "./types.js";

export interface ISaveCredentialStorageOperation {
    execute(params: { credential: StorageCredential }): Promise<void>;
}

/**
 * Upsert: creates the credential if absent, replaces it otherwise.
 */
export const SaveCredentialStorageOperation = createAbstraction<ISaveCredentialStorageOperation>(
    "SelfHostedAuth/Credential/SaveStorageOperation"
);

export namespace SaveCredentialStorageOperation {
    export type Interface = ISaveCredentialStorageOperation;
}
