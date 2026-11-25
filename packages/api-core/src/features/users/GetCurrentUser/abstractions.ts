import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";

// Use case specific errors
export interface IGetCurrentUserErrors {
    notAuthorized: NotAuthorizedError;
}

// Combined error type (use case errors + repository errors)
type GetCurrentUserError =
    | IGetCurrentUserErrors[keyof IGetCurrentUserErrors]
    | AdminUsersRepository.Error;

// Use case interface
export interface IGetCurrentUser {
    execute(): Promise<Result<AdminUser, GetCurrentUserError>>;
}

/** Retrieve the admin user of the current identity. */
export const GetCurrentUserUseCase = createAbstraction<IGetCurrentUser>("GetCurrentUserUseCase");

// Namespace exports
export namespace GetCurrentUserUseCase {
    export type Interface = IGetCurrentUser;
    export type Error = GetCurrentUserError;
}
