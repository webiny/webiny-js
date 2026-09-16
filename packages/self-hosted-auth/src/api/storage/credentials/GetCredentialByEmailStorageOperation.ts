import { createAbstraction } from "@webiny/feature/api";
import type { StorageCredential } from "./types.js";

export interface IGetCredentialByEmailStorageOperation {
    execute(params: { email: string }): Promise<StorageCredential | null>;
}

/**
 * The credential for an address, or `null`. Email is the global login key.
 */
export const GetCredentialByEmailStorageOperation =
    createAbstraction<IGetCredentialByEmailStorageOperation>(
        "SelfHostedAuth/Credential/GetByEmailStorageOperation"
    );

export namespace GetCredentialByEmailStorageOperation {
    export type Interface = IGetCredentialByEmailStorageOperation;
}
