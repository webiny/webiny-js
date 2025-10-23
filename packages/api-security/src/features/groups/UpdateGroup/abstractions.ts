import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, UpdateGroupInput } from "../shared/types.js";
import { GroupsRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginGroupsError,
    GroupValidationError
} from "../shared/errors.js";

export interface IUpdateGroupErrors {
    notAuthorized: NotAuthorizedError;
    cannotUpdatePlugin: CannotUpdatePluginGroupsError;
    validation: GroupValidationError;
}

type UpdateGroupError = IUpdateGroupErrors[keyof IUpdateGroupErrors] | GroupsRepository.Error;

export interface IUpdateGroup {
    execute(id: string, input: UpdateGroupInput): Promise<Result<Group, UpdateGroupError>>;
}

export const UpdateGroup = createAbstraction<IUpdateGroup>("UpdateGroup");

export namespace UpdateGroup {
    export type Interface = IUpdateGroup;
    export type Error = UpdateGroupError;
}

export interface GroupBeforeUpdatePayload {
    original: Group;
    updated: Group;
    input: UpdateGroupInput;
}

export interface GroupAfterUpdatePayload {
    original: Group;
    updated: Group;
    input: UpdateGroupInput;
}
