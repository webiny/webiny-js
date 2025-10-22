import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, UpdateGroupInput } from "../shared/types.js";
import {
    NotAuthorizedError,
    GroupNotFoundError,
    GroupStorageError,
    CannotUpdatePluginGroupsError
} from "../shared/errors.js";

type UpdateGroupError =
    | NotAuthorizedError
    | GroupNotFoundError
    | GroupStorageError
    | CannotUpdatePluginGroupsError
    | Error;

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
