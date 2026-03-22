import { createAbstraction } from "@webiny/feature/api";
import type { FolderLevelPermission } from "~/types.js";

interface ListFlpsParams {
    where: {
        path_startsWith?: string;
        parentId?: string;
        type: string;
    };
}

export interface IListFlps {
    execute: (params: ListFlpsParams) => Promise<FolderLevelPermission[]>;
}

/** List folder-level permissions. */
export const ListFlpsUseCase = createAbstraction<IListFlps>("ListFlpsUseCase");

export namespace ListFlpsUseCase {
    export type Interface = IListFlps;
}
