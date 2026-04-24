import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Role, ListRolesInput } from "../shared/types.js";
import { RolesRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IListRolesErrors {
    notAuthorized: NotAuthorizedError;
}

type ListRolesError = IListRolesErrors[keyof IListRolesErrors] | RolesRepository.Error;

export interface IListRoles {
    execute(params?: ListRolesInput): Promise<Result<Role[], ListRolesError>>;
}

/** List all security roles. */
export const ListRolesUseCase = createAbstraction<IListRoles>("ListRolesUseCase");

export namespace ListRolesUseCase {
    export type Interface = IListRoles;
    export type Error = ListRolesError;
}
