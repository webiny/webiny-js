import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, CreateGroupInput } from "../shared/types.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, GroupExistsError, GroupValidationError } from "../shared/errors.js";

export interface ICreateGroupErrors {
    notAuthorized: NotAuthorizedError;
    groupExists: GroupExistsError;
    validation: GroupValidationError;
}

type CreateGroupError = ICreateGroupErrors[keyof ICreateGroupErrors] | GroupsRepository.Error;

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
