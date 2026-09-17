import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { InvalidResetCodeError } from "~/api/domain/errors.js";
import type { CredentialsPersistenceError } from "~/api/domain/errors.js";
import type { PasswordResetPersistenceError } from "~/api/domain/errors.js";
import type { NotAuthorizedError } from "~/api/domain/errors.js";
import type { WeakPasswordError } from "~/api/domain/errors.js";

export interface ResetPasswordWithCodeInput {
    email: string;
    code: string;
    password: string;
}

export type ResetPasswordWithCodeError =
    | InvalidResetCodeError
    | WeakPasswordError
    | NotAuthorizedError
    | PasswordResetPersistenceError
    | CredentialsPersistenceError;

export interface IResetPasswordWithCodeUseCase {
    execute(input: ResetPasswordWithCodeInput): Promise<Result<true, ResetPasswordWithCodeError>>;
}

/**
 * Finishes the emailed password reset: checks the code, then sets the password.
 *
 * The account is taken from the stored code, never from the request, so a caller holding a valid
 * code for one address cannot aim it at another. The code is spent on success along with every
 * other outstanding code for that address, so an older message in the mailbox is worth nothing
 * afterwards.
 */
export const ResetPasswordWithCodeUseCase = createAbstraction<IResetPasswordWithCodeUseCase>(
    "ResetPasswordWithCodeUseCase"
);

export namespace ResetPasswordWithCodeUseCase {
    export type Interface = IResetPasswordWithCodeUseCase;
    export type Input = ResetPasswordWithCodeInput;
    export type Error = ResetPasswordWithCodeError;
}
