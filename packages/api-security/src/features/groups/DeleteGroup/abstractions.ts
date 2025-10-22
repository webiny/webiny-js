import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group } from "../shared/types.js";
import {
    NotAuthorizedError,
    GroupNotFoundError,
    GroupStorageError,
    CannotDeletePluginGroupsError
} from "../shared/errors.js";

type DeleteGroupError =
    | NotAuthorizedError
    | GroupNotFoundError
    | GroupStorageError
    | CannotDeletePluginGroupsError
    | Error;

export interface IDeleteGroup {
    execute(id: string): Promise<Result<void, DeleteGroupError>>;
}

export const DeleteGroup = createAbstraction<IDeleteGroup>("DeleteGroup");

export namespace DeleteGroup {
    export type Interface = IDeleteGroup;
    export type Error = DeleteGroupError;
}

export interface GroupBeforeDeletePayload {
    group: Group;
}

export interface GroupAfterDeletePayload {
    group: Group;
}
