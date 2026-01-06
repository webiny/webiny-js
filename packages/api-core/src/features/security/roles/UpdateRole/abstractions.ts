import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, UpdateRoleInput } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginRolesError,
    RoleValidationError
} from "../shared/errors.js";

export interface IUpdateRoleErrors {
    notAuthorized: NotAuthorizedError;
    cannotUpdatePlugin: CannotUpdatePluginRolesError;
    validation: RoleValidationError;
}

type UpdateRoleError = IUpdateRoleErrors[keyof IUpdateRoleErrors] | RolesRepository.Error;

export interface IUpdateRole {
    execute(id: string, input: UpdateRoleInput): Promise<Result<Role, UpdateRoleError>>;
}

export const UpdateRole = createAbstraction<IUpdateRole>("UpdateRole");

export namespace UpdateRole {
    export type Interface = IUpdateRole;
    export type Error = UpdateRoleError;
}

export interface RoleBeforeUpdatePayload {
    original: Role;
    updated: Role;
    input: UpdateRoleInput;
}

export interface RoleAfterUpdatePayload {
    original: Role;
    updated: Role;
    input: UpdateRoleInput;
}
