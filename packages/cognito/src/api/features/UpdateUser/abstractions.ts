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

export interface IUpdateUserUseCaseErrors {
    authorization: NotAuthorizedError;
    validation: UserValidationError;
    emailTaken: EmailTakenError;
    updateAdminUser: CoreUpdateUserUseCase.Error;
    cognitoUpdateUser: CognitoUpdateUserError;
}

type IUpdateAdminUserError = IUpdateUserUseCaseErrors[keyof IUpdateUserUseCaseErrors];

export interface IUpdateUserUseCase {
    execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, IUpdateAdminUserError>>;
}

export const UpdateUserUseCase = createAbstraction<IUpdateUserUseCase>("UpdateUserUseCase");

export namespace UpdateUserUseCase {
    export type Interface = IUpdateUserUseCase;
    export type Input = UpdateAdminUserInput;
    export type Error = IUpdateAdminUserError;
}
