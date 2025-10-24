import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/shared/types.js";
import type { ListUsersInput } from "~/features/shared/types.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/shared/errors.js";

// Use case specific errors
export interface IListUsersErrors {
    notAuthorized: NotAuthorizedError;
}

// Combined error type (use case errors + repository errors)
type ListUsersError = IListUsersErrors[keyof IListUsersErrors] | AdminUsersRepository.Error;

// Use case interface
export interface IListUsers {
    execute(input?: ListUsersInput): Promise<Result<AdminUser[], ListUsersError>>;
}

// Abstraction constant
export const ListUsersUseCase = createAbstraction<IListUsers>("ListUsersUseCase");

// Namespace exports
export namespace ListUsersUseCase {
    export type Interface = IListUsers;
    export type Error = ListUsersError;
}
