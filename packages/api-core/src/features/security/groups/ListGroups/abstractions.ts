import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, ListGroupsInput } from "../shared/types.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IListGroupsErrors {
    notAuthorized: NotAuthorizedError;
}

type ListGroupsError = IListGroupsErrors[keyof IListGroupsErrors] | GroupsRepository.Error;

export interface IListGroups {
    execute(params?: ListGroupsInput): Promise<Result<Group[], ListGroupsError>>;
}

export const ListGroupsUseCase = createAbstraction<IListGroups>("ListGroupsUseCase");

export namespace ListGroupsUseCase {
    export type Interface = IListGroups;
    export type Error = ListGroupsError;
}
