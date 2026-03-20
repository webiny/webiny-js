import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, GetRoleInput, ListRolesInput } from "./types.js";
import type { SecurityPermission } from "~/types/security.js";
import { RoleNotFoundError, RoleStorageError } from "./errors.js";

export interface IRolesRepositoryErrors {
    base: RoleNotFoundError | RoleStorageError;
}

type RepositoryError = IRolesRepositoryErrors[keyof IRolesRepositoryErrors];

export interface IRolesRepository {
    get(params: GetRoleInput): Promise<Result<Role, RepositoryError>>;
    list(params: ListRolesInput): Promise<Result<Role[], RepositoryError>>;
    create(data: Role): Promise<Result<void, RepositoryError>>;
    update(data: Role): Promise<Result<void, RepositoryError>>;
    delete(role: Role): Promise<Result<void, RepositoryError>>;
}

export const RolesRepository = createAbstraction<IRolesRepository>("RolesRepository");

export namespace RolesRepository {
    export type Interface = IRolesRepository;
    export type Error = RepositoryError;
}

export type CodeRole = {
    name: string;
    slug: string;
    description: string;
    permissions: SecurityPermission[];
    system?: boolean;
};

export interface IRoleFactory {
    execute(): Promise<CodeRole[]>;
}

export const RoleFactory = createAbstraction<IRoleFactory>("RoleFactory");

export namespace RoleFactory {
    export type Interface = IRoleFactory;
    export type Return = Promise<CodeRole[]>;
    export type Role = CodeRole;
}
