import { createAbstraction } from "@webiny/feature/api";

export interface ISetPasswordResetCodeHashStorageOperation {
    /**
     * Sets the hash on a row that has none yet. Returns false when there was no such row: it is
     * gone, or it already has a hash.
     */
    execute(params: { id: string; codeHash: string }): Promise<boolean>;
}

/**
 * Gives a request row its code. The request writes the row without one, and the task that mails
 * the code sets it, once. Only a row with no hash is updated, so a task that runs twice cannot
 * replace a code that is already in somebody's mailbox.
 */
export const SetPasswordResetCodeHashStorageOperation =
    createAbstraction<ISetPasswordResetCodeHashStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/SetHashStorageOperation"
    );

export namespace SetPasswordResetCodeHashStorageOperation {
    export type Interface = ISetPasswordResetCodeHashStorageOperation;
}
