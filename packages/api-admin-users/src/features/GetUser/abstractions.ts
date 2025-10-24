import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/shared/types.js";
import type { GetUserInput } from "~/features/shared/types.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/shared/errors.js";

// Use case specific errors
export interface IGetUserErrors {
    notAuthorized: NotAuthorizedError;
}

// Combined error type (use case errors + repository errors)
type GetUserError = IGetUserErrors[keyof IGetUserErrors] | AdminUsersRepository.Error;

// Use case interface
export interface IGetUser {
    execute(input: GetUserInput): Promise<Result<AdminUser, GetUserError>>;
}

// Abstraction constant
export const GetUserUseCase = createAbstraction<IGetUser>("GetUserUseCase");

// Namespace exports
export namespace GetUserUseCase {
    export type Interface = IGetUser;
    export type Error = GetUserError;
}
