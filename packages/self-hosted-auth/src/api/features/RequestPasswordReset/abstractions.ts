import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { MailerNotConfiguredError } from "~/api/domain/errors.js";
import type { PasswordResetPersistenceError } from "~/api/domain/errors.js";
import type { TooManyResetRequestsError } from "~/api/domain/errors.js";

export interface RequestPasswordResetInput {
    email: string;
}

export type RequestPasswordResetError =
    | MailerNotConfiguredError
    | TooManyResetRequestsError
    | PasswordResetPersistenceError;

export interface IRequestPasswordResetUseCase {
    execute(input: RequestPasswordResetInput): Promise<Result<true, RequestPasswordResetError>>;
}

/**
 * Starts the emailed password reset: records the request, and mails a code if the address has an
 * account.
 *
 * Succeeds whether or not the account exists. That is the whole point of the design and not an
 * oversight: anything that answered differently would turn this into a way to find out which
 * addresses are registered, and it is reachable by anyone who can load the login screen.
 *
 * The two errors it does report are both properties of the installation rather than of the address,
 * so neither one says anything about the account.
 */
export const RequestPasswordResetUseCase = createAbstraction<IRequestPasswordResetUseCase>(
    "RequestPasswordResetUseCase"
);

export namespace RequestPasswordResetUseCase {
    export type Interface = IRequestPasswordResetUseCase;
    export type Input = RequestPasswordResetInput;
    export type Error = RequestPasswordResetError;
}
