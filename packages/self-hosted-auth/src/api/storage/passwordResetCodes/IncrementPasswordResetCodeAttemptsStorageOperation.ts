import { createAbstraction } from "@webiny/feature/api";

export interface IIncrementPasswordResetCodeAttemptsStorageOperation {
    execute(params: { id: string }): Promise<void>;
}

/**
 * Adds one to a code's failed verification count. Atomic where the database can do it, because
 * two wrong guesses arriving together must not both read the same count and write it back.
 */
export const IncrementPasswordResetCodeAttemptsStorageOperation =
    createAbstraction<IIncrementPasswordResetCodeAttemptsStorageOperation>(
        "SelfHostedAuth/PasswordResetCode/IncrementAttemptsStorageOperation"
    );

export namespace IncrementPasswordResetCodeAttemptsStorageOperation {
    export type Interface = IIncrementPasswordResetCodeAttemptsStorageOperation;
}
