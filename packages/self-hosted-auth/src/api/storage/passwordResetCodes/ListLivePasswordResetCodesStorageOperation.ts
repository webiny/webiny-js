import { createAbstraction } from "@webiny/feature/api";
import type { StoredPasswordResetCode } from "./types.js";

export interface IListLivePasswordResetCodesStorageOperation {
    execute(params: { email: string; now: string }): Promise<StoredPasswordResetCode[]>;
}

/**
 * Codes for an address that are neither spent nor expired, newest first. Normally one, but a
 * request that raced with another can leave two, and both have to be checked.
 */
export const ListLivePasswordResetCodesStorageOperation =
    createAbstraction<IListLivePasswordResetCodesStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/ListLiveStorageOperation"
    );

export namespace ListLivePasswordResetCodesStorageOperation {
    export type Interface = IListLivePasswordResetCodesStorageOperation;
}
