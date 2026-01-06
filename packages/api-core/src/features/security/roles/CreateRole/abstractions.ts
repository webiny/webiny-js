import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, CreateRoleInput } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, RoleExistsError, RoleValidationError } from "../shared/errors.js";

export interface ICreateRoleErrors {
    notAuthorized: NotAuthorizedError;
    roleExists: RoleExistsError;
    validation: RoleValidationError;
}

type CreateRoleError = ICreateRoleErrors[keyof ICreateRoleErrors] | RolesRepository.Error;

export interface ICreateRole {
    execute(input: CreateRoleInput): Promise<Result<Role, CreateRoleError>>;
}

export const CreateRoleUseCase = createAbstraction<ICreateRole>("CreateRoleUseCase");

export namespace CreateRoleUseCase {
    export type Interface = ICreateRole;
    export type Error = CreateRoleError;
}

export interface RoleBeforeCreatePayload {
    role: Role;
    input: CreateRoleInput;
}

export interface RoleAfterCreatePayload {
    role: Role;
    input: CreateRoleInput;
}
