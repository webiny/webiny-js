import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { CreateUserInput } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    EmailTakenError,
    UserValidationError
} from "~/features/users/shared/errors.js";

// Use case specific errors
export interface ICreateUserErrors {
    notAuthorized: NotAuthorizedError;
    userExists: EmailTakenError;
    validation: UserValidationError;
}

// Combined error type (use case errors + repository errors)
type CreateUserError = ICreateUserErrors[keyof ICreateUserErrors] | AdminUsersRepository.Error;

// Use case interface
export interface ICreateUser {
    execute(input: CreateUserInput): Promise<Result<AdminUser, CreateUserError>>;
}

/** Create a new admin user. */
export const CreateUserUseCase = createAbstraction<ICreateUser>("CreateUserUseCase");

// Namespace exports
export namespace CreateUserUseCase {
    export type Interface = ICreateUser;
    export type Input = CreateUserInput;
    export type Error = CreateUserError;
}

// Event payload types
export interface UserBeforeCreatePayload {
    user: AdminUser;
    input: CreateUserInput;
}

export interface UserAfterCreatePayload {
    user: AdminUser;
    input: CreateUserInput;
}
