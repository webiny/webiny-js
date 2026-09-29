import { createAbstraction } from "@webiny/feature/api";

export interface IDeleteExpiredPasswordResetCodesStorageOperation {
    execute(params: { before: string }): Promise<void>;
}

/**
 * Drops rows that are long expired. Called opportunistically on write, not on a schedule.
 */
export const DeleteExpiredPasswordResetCodesStorageOperation =
    createAbstraction<IDeleteExpiredPasswordResetCodesStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/DeleteExpiredStorageOperation"
    );

export namespace DeleteExpiredPasswordResetCodesStorageOperation {
    export type Interface = IDeleteExpiredPasswordResetCodesStorageOperation;
}
