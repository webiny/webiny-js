import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/types.js";
import type {
    GetUserInput,
    ListUsersInput
} from "./types.js";
import {
    UserNotFoundError,
    UserStorageError
} from "./errors.js";

// Repository error interface
export interface IAdminUsersRepositoryErrors {
    base: UserNotFoundError | UserStorageError;
}

type RepositoryError = IAdminUsersRepositoryErrors[keyof IAdminUsersRepositoryErrors];

// Repository interface
export interface IAdminUsersRepository {
    get(params: GetUserInput): Promise<Result<AdminUser, RepositoryError>>;
    list(params: ListUsersInput): Promise<Result<AdminUser[], RepositoryError>>;
    create(user: AdminUser): Promise<Result<AdminUser, RepositoryError>>;
    update(user: AdminUser): Promise<Result<AdminUser, RepositoryError>>;
    delete(user: AdminUser): Promise<Result<void, RepositoryError>>;
    clearCache(keys: Array<{ tenant: string; id: string }>): void;
}

// Abstraction constant
export const AdminUsersRepository = createAbstraction<IAdminUsersRepository>(
    "AdminUsersRepository"
);

// Namespace exports
export namespace AdminUsersRepository {
    export type Interface = IAdminUsersRepository;
    export type Error = RepositoryError;
}
