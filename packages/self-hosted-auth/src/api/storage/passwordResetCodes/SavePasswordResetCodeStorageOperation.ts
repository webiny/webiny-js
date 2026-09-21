import { createAbstraction } from "@webiny/feature/api";
import type { StoredPasswordResetCode } from "./types.js";

export interface ISavePasswordResetCodeStorageOperation {
    execute(params: { code: StoredPasswordResetCode }): Promise<void>;
}

/**
 * Stores a freshly minted code. One row per request, including requests naming an address with
 * no account, because the request limit counts these rows.
 */
export const SavePasswordResetCodeStorageOperation =
    createAbstraction<ISavePasswordResetCodeStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/SaveStorageOperation"
    );

export namespace SavePasswordResetCodeStorageOperation {
    export type Interface = ISavePasswordResetCodeStorageOperation;
}
