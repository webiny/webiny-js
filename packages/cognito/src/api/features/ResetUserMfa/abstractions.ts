import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import type {
    CognitoExternalUserError,
    CognitoResetMfaError,
    CognitoSharedAccountError
} from "~/api/domain/errors.js";

export interface IResetUserMfaUseCaseErrors {
    authorization: NotAuthorizedError;
    getUser: GetUserUseCase.Error;
    externalUser: CognitoExternalUserError;
    findUserRecords: FindUserRecordsUseCase.Error;
    sharedAccount: CognitoSharedAccountError;
    cognitoResetMfa: CognitoResetMfaError;
}

type IResetUserMfaError = IResetUserMfaUseCaseErrors[keyof IResetUserMfaUseCaseErrors];

export interface IResetUserMfaUseCase {
    /**
     * Deletes the user's TOTP software token, so they set up MFA again on their next sign-in.
     * The account is shared by all of the person's tenants, so this applies in all of them;
     * for a shared account, only the person themselves may reset it.
     */
    execute(id: string): Promise<Result<void, IResetUserMfaError>>;
}

export const ResetUserMfaUseCase = createAbstraction<IResetUserMfaUseCase>("ResetUserMfaUseCase");

export namespace ResetUserMfaUseCase {
    export type Interface = IResetUserMfaUseCase;
    export type Error = IResetUserMfaError;
}
