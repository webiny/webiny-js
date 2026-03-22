import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";
import { CannotDeleteOwnAccountError } from "./errors.js";

// Use case specific errors
export interface IDeleteUserErrors {
    notAuthorized: NotAuthorizedError;
    cannotDeleteOwnAccount: CannotDeleteOwnAccountError;
}

// Combined error type (use case errors + repository errors)
export type DeleteUserError =
    | IDeleteUserErrors[keyof IDeleteUserErrors]
    | AdminUsersRepository.Error;

// Use case interface
export interface IDeleteUser {
    execute(id: string): Promise<Result<void, DeleteUserError>>;
}

/** Delete an admin user. */
export const DeleteUserUseCase = createAbstraction<IDeleteUser>("DeleteUserUseCase");

// Namespace exports
export namespace DeleteUserUseCase {
    export type Interface = IDeleteUser;
    export type Error = DeleteUserError;
}

// Event payload types
export interface UserBeforeDeletePayload {
    user: AdminUser;
}

export interface UserAfterDeletePayload {
    user: AdminUser;
}
