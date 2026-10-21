import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/users/UpdateUser/index.js";
import type { AccountExistsError, CredentialsPersistenceError } from "~/api/domain/errors.js";
import type { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";

export interface UpdateAdminUserInput {
    displayName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    avatar?: Record<string, any> | null;
    roles?: string[];
    teams?: string[];
}

export type UpdateAdminUserError =
    | NotAuthorizedError
    | UserValidationError
    | AccountExistsError
    | CredentialsPersistenceError
    | GetUserUseCase.Error
    | CoreUpdateUser.Error
    | SetPasswordUseCase.Error;

export interface IUpdateAdminUserUseCase {
    execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, UpdateAdminUserError>>;
}

/**
 * Updates an admin user and keeps its credential in step: a new password is stored, and a new email
 * address becomes the one the user signs in with.
 */
export const UpdateAdminUserUseCase =
    createAbstraction<IUpdateAdminUserUseCase>("UpdateAdminUserUseCase");

export namespace UpdateAdminUserUseCase {
    export type Interface = IUpdateAdminUserUseCase;
    export type Input = UpdateAdminUserInput;
    export type Error = UpdateAdminUserError;
}
