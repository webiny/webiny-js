import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Group, ListGroupsInput } from "../shared/types.js";

export interface IListGroups {
    execute(params: ListGroupsInput): Promise<Result<Group[], Error>>;
}

export const ListGroups = createAbstraction<IListGroups>("ListGroups");

export namespace ListGroups {
    export type Interface = IListGroups;
}
