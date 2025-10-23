import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, GetGroupInput } from "../shared/types.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IGetGroupErrors {
    notAuthorized: NotAuthorizedError;
}

type GetGroupError = IGetGroupErrors[keyof IGetGroupErrors] | GroupsRepository.Error;

export interface IGetGroup {
    execute(params: GetGroupInput): Promise<Result<Group, GetGroupError>>;
}

export const GetGroup = createAbstraction<IGetGroup>("GetGroup");

export namespace GetGroup {
    export type Interface = IGetGroup;
    export type Error = GetGroupError;
}
