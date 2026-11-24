import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { CognitoExternalUserError, CognitoResetMfaError } from "~/api/domain/errors.js";

export interface IResetUserMfaUseCaseErrors {
    authorization: NotAuthorizedError;
    getUser: GetUserUseCase.Error;
    externalUser: CognitoExternalUserError;
    cognitoResetMfa: CognitoResetMfaError;
}

type IResetUserMfaError = IResetUserMfaUseCaseErrors[keyof IResetUserMfaUseCaseErrors];

export interface IResetUserMfaUseCase {
    /**
     * Deletes the user's TOTP software token, so they set up MFA again on their next sign-in.
     * The account is shared by all of the person's tenants, so this applies in all of them.
     */
    execute(id: string): Promise<Result<void, IResetUserMfaError>>;
}

export const ResetUserMfaUseCase = createAbstraction<IResetUserMfaUseCase>("ResetUserMfaUseCase");

export namespace ResetUserMfaUseCase {
    export type Interface = IResetUserMfaUseCase;
    export type Error = IResetUserMfaError;
}
