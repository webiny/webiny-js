import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type {
    NotAuthorizedError,
    EmailTakenError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { UpdateUserUseCase as CoreUpdateUserUseCase } from "@webiny/api-core/features/users/UpdateUser/index.js";
import type { CognitoUpdateUserError } from "~/api/domain/errors.js";

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

export interface IUpdateAdminUserUseCaseErrors {
    authorization: NotAuthorizedError;
    validation: UserValidationError;
    emailTaken: EmailTakenError;
    updateAdminUser: CoreUpdateUserUseCase.Error;
    cognitoUpdateUser: CognitoUpdateUserError;
}

type IUpdateAdminUserError = IUpdateAdminUserUseCaseErrors[keyof IUpdateAdminUserUseCaseErrors];

export interface IUpdateAdminUserUseCase {
    execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, IUpdateAdminUserError>>;
}

export const UpdateAdminUserUseCase =
    createAbstraction<IUpdateAdminUserUseCase>("UpdateAdminUserUseCase");

export namespace UpdateAdminUserUseCase {
    export type Interface = IUpdateAdminUserUseCase;
    export type Input = UpdateAdminUserInput;
    export type Error = IUpdateAdminUserError;
}
