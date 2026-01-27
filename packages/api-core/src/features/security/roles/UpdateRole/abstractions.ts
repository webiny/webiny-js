import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, UpdateRoleInput as UpdateRoleUseCaseInput } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginRolesError,
    RoleValidationError
} from "../shared/errors.js";

export interface IUpdateRoleUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    cannotUpdatePlugin: CannotUpdatePluginRolesError;
    validation: RoleValidationError;
}

type UpdateRoleUseCaseError =
    | IUpdateRoleUseCaseErrors[keyof IUpdateRoleUseCaseErrors]
    | RolesRepository.Error;

export interface IUpdateRoleUseCase {
    execute(
        id: string,
        input: UpdateRoleUseCaseInput
    ): Promise<Result<Role, UpdateRoleUseCaseError>>;
}

export const UpdateRoleUseCase = createAbstraction<IUpdateRoleUseCase>("UpdateRoleUseCase");

export namespace UpdateRoleUseCase {
    export type Interface = IUpdateRoleUseCase;
    export type Error = UpdateRoleUseCaseError;
}

export interface RoleBeforeUpdatePayload {
    original: Role;
    updated: Role;
    input: UpdateRoleUseCaseInput;
}

export interface RoleAfterUpdatePayload {
    original: Role;
    updated: Role;
    input: UpdateRoleUseCaseInput;
}
