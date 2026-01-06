import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, GetRoleInput } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IGetRoleErrors {
    notAuthorized: NotAuthorizedError;
}

type GetRoleError = IGetRoleErrors[keyof IGetRoleErrors] | RolesRepository.Error;

export interface IGetRole {
    execute(params: GetRoleInput): Promise<Result<Role, GetRoleError>>;
}

export const GetRoleUseCase = createAbstraction<IGetRole>("GetRoleUseCase");

export namespace GetRoleUseCase {
    export type Interface = IGetRole;
    export type Error = GetRoleError;
}
