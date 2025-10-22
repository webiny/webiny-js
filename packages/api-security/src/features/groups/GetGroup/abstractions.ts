import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, GetGroupInput } from "../shared/types.js";

export interface IGetGroup {
    execute(params: GetGroupInput): Promise<Result<Group, Error>>;
}

export const GetGroup = createAbstraction<IGetGroup>("GetGroup");

export namespace GetGroup {
    export type Interface = IGetGroup;
}
