import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, CreateGroupInput } from "../shared/types.js";

export interface ICreateGroup {
    execute(input: CreateGroupInput): Promise<Result<Group, Error>>;
}

export const CreateGroup = createAbstraction<ICreateGroup>("CreateGroup");

export namespace CreateGroup {
    export type Interface = ICreateGroup;
}

export interface GroupBeforeCreatePayload {
    group: Group;
    input: CreateGroupInput;
}

export interface GroupAfterCreatePayload {
    group: Group;
    input: CreateGroupInput;
}
