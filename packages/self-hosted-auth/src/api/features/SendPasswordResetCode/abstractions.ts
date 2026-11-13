import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CredentialsPersistenceError } from "~/api/domain/errors.js";
import type { PasswordResetDeliveryError } from "~/api/domain/errors.js";
import type { PasswordResetPersistenceError } from "~/api/domain/errors.js";

export const SEND_PASSWORD_RESET_CODE_TASK = "selfHostedAuthSendPasswordResetCode";

export interface SendPasswordResetCodeInput {
    /** The request row the code is stored on. */
    codeId: string;
    /** The address as the user typed it. `CredentialsRepository` normalizes it for the lookup. */
    email: string;
}

/**
 * What became of a request. `noAccount` and `alreadyIssued` send nothing and are not failures: the
 * first is the ordinary outcome for an unregistered address, the second a repeated run.
 */
export type SendPasswordResetCodeOutcome = "sent" | "noAccount" | "alreadyIssued";

export type SendPasswordResetCodeError =
    | CredentialsPersistenceError
    | PasswordResetPersistenceError
    | PasswordResetDeliveryError;

export interface ISendPasswordResetCodeUseCase {
    execute(
        input: SendPasswordResetCodeInput
    ): Promise<Result<SendPasswordResetCodeOutcome, SendPasswordResetCodeError>>;
}

/**
 * Mails the code for one reset request, if the address has an account.
 *
 * Everything that differs between an address with an account and one without happens here: the
 * credential lookup, generating and hashing the code, and the SMTP send. `RequestPasswordReset`
 * only writes the request row and starts `SendPasswordResetCodeTask`, which calls this, so the
 * request costs the same for every address.
 *
 * The code is generated here, not passed in. Task input is stored in the tasks table as it is, and
 * the code must only ever exist as a hash and in the email.
 */
export const SendPasswordResetCodeUseCase = createAbstraction<ISendPasswordResetCodeUseCase>(
    "SendPasswordResetCodeUseCase"
);

export namespace SendPasswordResetCodeUseCase {
    export type Interface = ISendPasswordResetCodeUseCase;
    export type Input = SendPasswordResetCodeInput;
    export type Outcome = SendPasswordResetCodeOutcome;
    export type Error = SendPasswordResetCodeError;
}
