import { Abstraction } from "@webiny/di-container";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";

// Use Case Abstraction
export interface IListFoldersUseCase {
    execute: (params: ListFoldersParams) => Promise<[Folder[], ListMeta]>;
}

export const ListFoldersUseCase = new Abstraction<IListFoldersUseCase>("ListFoldersUseCase");

export namespace ListFoldersUseCase {
    export type Interface = IListFoldersUseCase;
}
