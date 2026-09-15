import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    CredentialNotFoundForEmailError,
    InvalidResetTokenError,
    NotAuthorizedError,
    WeakPasswordError
} from "~/api/domain/errors.js";

export interface CliResetPasswordInput {
    /** Short-lived token minted by the `reset-password` CLI command. */
    token: string;
    password: string;
}

export type CliResetPasswordError =
    | InvalidResetTokenError
    | CredentialNotFoundForEmailError
    | WeakPasswordError
    | NotAuthorizedError;

export interface ICliResetPasswordUseCase {
    execute(input: CliResetPasswordInput): Promise<Result<true, CliResetPasswordError>>;
}

/**
 * Sets a user's password on the strength of a CLI reset token alone, with no logged-in
 * identity involved. This is the escape hatch for an operator locked out of the admin UI (no mail
 * configured, forgotten password, last admin account).
 *
 * The token is the entire authorization. It can only be minted by someone holding
 * `SelfHostedAuthSigningSecret`, which already permits impersonating any user, so this adds
 * no privilege. See the note in `shared/cliResetToken.ts`.
 */
export const CliResetPasswordUseCase =
    createAbstraction<ICliResetPasswordUseCase>("CliResetPasswordUseCase");

export namespace CliResetPasswordUseCase {
    export type Interface = ICliResetPasswordUseCase;
    export type Input = CliResetPasswordInput;
    export type Error = CliResetPasswordError;
}
