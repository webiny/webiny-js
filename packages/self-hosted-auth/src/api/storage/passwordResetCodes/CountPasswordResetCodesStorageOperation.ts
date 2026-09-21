import { createAbstraction } from "@webiny/feature/api";

export interface ICountPasswordResetCodesStorageOperation {
    execute(params: { email: string; since: string }): Promise<number>;
}

/**
 * How many codes have been requested for an address since a given time. This is the request
 * limit's only source of truth, which is why a row exists for every address that is asked about.
 */
export const CountPasswordResetCodesStorageOperation =
    createAbstraction<ICountPasswordResetCodesStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/CountStorageOperation"
    );

export namespace CountPasswordResetCodesStorageOperation {
    export type Interface = ICountPasswordResetCodesStorageOperation;
}
