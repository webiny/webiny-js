import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotDeletePluginRolesError,
    CannotDeleteSystemRolesError
} from "../shared/errors.js";

export interface IDeleteRoleErrors {
    notAuthorized: NotAuthorizedError;
    cannotDeletePlugin: CannotDeletePluginRolesError;
    cannotDeleteSystem: CannotDeleteSystemRolesError;
}

type DeleteRoleError = IDeleteRoleErrors[keyof IDeleteRoleErrors] | RolesRepository.Error;

export interface IDeleteRole {
    execute(id: string): Promise<Result<void, DeleteRoleError>>;
}

/** Delete a security role. */
export const DeleteRoleUseCase = createAbstraction<IDeleteRole>("DeleteRoleUseCase");

export namespace DeleteRoleUseCase {
    export type Interface = IDeleteRole;
    export type Error = DeleteRoleError;
}

export interface RoleBeforeDeletePayload {
    role: Role;
}

export interface RoleAfterDeletePayload {
    role: Role;
}
