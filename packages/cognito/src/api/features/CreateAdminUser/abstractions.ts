import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type {
    NotAuthorizedError,
    EmailTakenError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { RepositoryError } from "@webiny/api-core/features/users/shared/abstractions.js";
import type { CognitoAccountExistsError, CognitoCreateUserError } from "~/api/domain/errors.js";

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

export interface ICreateAdminUserUseCaseErrors {
    authorization: NotAuthorizedError;
    validation: UserValidationError;
    emailTaken: EmailTakenError;
    repository: RepositoryError;
    cognitoAccountExists: CognitoAccountExistsError;
    cognitoCreateUser: CognitoCreateUserError;
}

type CreateAdminUserError = ICreateAdminUserUseCaseErrors[keyof ICreateAdminUserUseCaseErrors];

export interface ICreateAdminUserUseCase {
    execute(input: CreateAdminUserInput): Promise<Result<AdminUser, CreateAdminUserError>>;
}

export const CreateAdminUserUseCase =
    createAbstraction<ICreateAdminUserUseCase>("CreateAdminUserUseCase");

export namespace CreateAdminUserUseCase {
    export type Interface = ICreateAdminUserUseCase;
    export type Input = CreateAdminUserInput;
    export type Error = CreateAdminUserError;
}
