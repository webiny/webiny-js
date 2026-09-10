import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup, CmsGroupStorageOperationsListParams } from "~/types/index.js";

export interface IListGroupsStorageOperation {
    execute(params: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]>;
}

export const ListGroupsStorageOperation = createAbstraction<IListGroupsStorageOperation>(
    "Cms/Group/ListGroupsStorageOperation"
);

export namespace ListGroupsStorageOperation {
    export type Interface = IListGroupsStorageOperation;
}
