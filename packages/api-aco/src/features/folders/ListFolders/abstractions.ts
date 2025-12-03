import { createAbstraction } from "@webiny/feature/api";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";

// Use Case Abstraction
export interface IListFoldersUseCase {
    execute: (params: ListFoldersParams) => Promise<[Folder[], ListMeta]>;
}

export const ListFoldersUseCase = createAbstraction<IListFoldersUseCase>("ListFoldersUseCase");

export namespace ListFoldersUseCase {
    export type Interface = IListFoldersUseCase;
}
