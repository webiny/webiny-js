import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, CreateGroupInput } from "../shared/types.js";
import { NotAuthorizedError, GroupExistsError, GroupStorageError } from "../shared/errors.js";

type CreateGroupError = NotAuthorizedError | GroupExistsError | GroupStorageError | Error;

export interface ICreateGroup {
    execute(input: CreateGroupInput): Promise<Result<Group, CreateGroupError>>;
}

export const CreateGroup = createAbstraction<ICreateGroup>("CreateGroup");

export namespace CreateGroup {
    export type Interface = ICreateGroup;
    export type Error = CreateGroupError;
}

export interface GroupBeforeCreatePayload {
    group: Group;
    input: CreateGroupInput;
}

export interface GroupAfterCreatePayload {
    group: Group;
    input: CreateGroupInput;
}
