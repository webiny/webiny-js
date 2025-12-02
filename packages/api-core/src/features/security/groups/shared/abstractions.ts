import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, GetGroupInput, ListGroupsInput } from "./types.js";
import { GroupNotFoundError, GroupStorageError } from "./errors.js";

export interface IGroupsRepositoryErrors {
    base: GroupNotFoundError | GroupStorageError;
}

type RepositoryError = IGroupsRepositoryErrors[keyof IGroupsRepositoryErrors];

export interface IGroupsRepository {
    get(params: GetGroupInput): Promise<Result<Group, RepositoryError>>;
    list(params: ListGroupsInput): Promise<Result<Group[], RepositoryError>>;
    create(data: Group): Promise<Result<void, RepositoryError>>;
    update(data: Group): Promise<Result<void, RepositoryError>>;
    delete(group: Group): Promise<Result<void, RepositoryError>>;
}

export const GroupsRepository = createAbstraction<IGroupsRepository>("GroupsRepository");

export namespace GroupsRepository {
    export type Interface = IGroupsRepository;
    export type Error = RepositoryError;
}
