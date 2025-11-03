import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { UpdateUserInput } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError, UserValidationError } from "~/features/users/shared/errors.js";

// Use case specific errors
export interface IUpdateUserErrors {
    notAuthorized: NotAuthorizedError;
    validation: UserValidationError;
}

// Combined error type (use case errors + repository errors)
type UpdateUserError = IUpdateUserErrors[keyof IUpdateUserErrors] | AdminUsersRepository.Error;

// Use case interface
export interface IUpdateUser {
    execute(id: string, input: UpdateUserInput): Promise<Result<AdminUser, UpdateUserError>>;
}

// Abstraction constant
export const UpdateUserUseCase = createAbstraction<IUpdateUser>("UpdateUserUseCase");

// Namespace exports
export namespace UpdateUserUseCase {
    export type Interface = IUpdateUser;
    export type Error = UpdateUserError;
}

// Event payload types
export interface UserBeforeUpdatePayload {
    user: AdminUser;
    updateData: Partial<AdminUser>;
    input: UpdateUserInput;
}

export interface UserAfterUpdatePayload {
    originalUser: AdminUser;
    updatedUser: AdminUser;
    input: UpdateUserInput;
}
