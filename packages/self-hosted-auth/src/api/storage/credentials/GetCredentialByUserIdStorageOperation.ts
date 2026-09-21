import { createAbstraction } from "@webiny/feature/api";
import type { StorageCredential } from "./types.js";

export interface IGetCredentialByUserIdStorageOperation {
    execute(params: { userId: string }): Promise<StorageCredential | null>;
}

/**
 * The credential for a user id, or `null`.
 */
export const GetCredentialByUserIdStorageOperation =
    createAbstraction<IGetCredentialByUserIdStorageOperation>(
        "SelfHostedAuth/Credential/GetByUserIdStorageOperation"
    );

export namespace GetCredentialByUserIdStorageOperation {
    export type Interface = IGetCredentialByUserIdStorageOperation;
}
