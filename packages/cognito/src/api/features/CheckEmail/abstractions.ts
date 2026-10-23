import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { CognitoGetUserError } from "~/api/domain/errors.js";

/**
 * - `AVAILABLE`: a new user can be created with this email.
 * - `EXISTS_HERE`: the current tenant already has a user with this email.
 * - `EXISTS_ELSEWHERE`: the email has an account in another tenant, which can be linked here.
 */
export type EmailStatus = "AVAILABLE" | "EXISTS_HERE" | "EXISTS_ELSEWHERE";

export interface ICheckEmailUseCaseErrors {
    authorization: NotAuthorizedError;
    validation: UserValidationError;
    cognito: CognitoGetUserError;
}

type CheckEmailError = ICheckEmailUseCaseErrors[keyof ICheckEmailUseCaseErrors];

/**
 * Tells an administrator whether an email can be used for a new user in the current tenant.
 * It only says whether an account exists elsewhere, never in which tenants.
 */
export interface ICheckEmailUseCase {
    execute(email: string): Promise<Result<EmailStatus, CheckEmailError>>;
}

export const CheckEmailUseCase = createAbstraction<ICheckEmailUseCase>("CheckEmailUseCase");

export namespace CheckEmailUseCase {
    export type Interface = ICheckEmailUseCase;
    export type Status = EmailStatus;
    export type Error = CheckEmailError;
}
