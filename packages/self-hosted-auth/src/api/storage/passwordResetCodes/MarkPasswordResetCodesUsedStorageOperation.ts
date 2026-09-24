import { createAbstraction } from "@webiny/feature/api";

export interface IMarkPasswordResetCodesUsedStorageOperation {
    execute(params: { email: string; usedOn: string }): Promise<void>;
}

/**
 * Spends every live code for an address. Used on a successful reset, so that an older code still
 * sitting in the mailbox is worth nothing afterwards.
 */
export const MarkPasswordResetCodesUsedStorageOperation =
    createAbstraction<IMarkPasswordResetCodesUsedStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/MarkUsedStorageOperation"
    );

export namespace MarkPasswordResetCodesUsedStorageOperation {
    export type Interface = IMarkPasswordResetCodesUsedStorageOperation;
}
