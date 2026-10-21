import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { CreateUserUseCase as CoreCreateUser } from "@webiny/api-core/features/users/CreateUser/index.js";
import type { AccountExistsError } from "~/api/domain/errors.js";
import type { SetPasswordUseCase } from "~/api/features/SetPassword/index.js";

export interface CreateAdminUserInput {
    id?: string;
    displayName?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
    avatar?: Record<string, any> | null;
    roles?: string[];
    teams?: string[];
}

export type CreateAdminUserError =
    | NotAuthorizedError
    | UserValidationError
    | AccountExistsError
    | CoreCreateUser.Error
    | SetPasswordUseCase.Error;

export interface ICreateAdminUserUseCase {
    execute(input: CreateAdminUserInput): Promise<Result<AdminUser, CreateAdminUserError>>;
}

/**
 * Creates an admin user that can sign in: the user record through api-core, and the password
 * through `SetPasswordUseCase`. The self-hosted counterpart of Cognito's `CreateUserUseCase`.
 */
export const CreateAdminUserUseCase =
    createAbstraction<ICreateAdminUserUseCase>("CreateAdminUserUseCase");

export namespace CreateAdminUserUseCase {
    export type Interface = ICreateAdminUserUseCase;
    export type Input = CreateAdminUserInput;
    export type Error = CreateAdminUserError;
}
