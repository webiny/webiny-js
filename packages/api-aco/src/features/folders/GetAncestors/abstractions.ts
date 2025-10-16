import { Abstraction } from "@webiny/di-container";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface GetAncestorsParams {
    folder: Folder;
}

export interface IGetAncestorsUseCase {
    execute: (params: GetAncestorsParams) => Promise<Folder[]>;
}

export const GetAncestorsUseCase = new Abstraction<IGetAncestorsUseCase>("GetAncestorsUseCase");

export namespace GetAncestorsUseCase {
    export type Interface = IGetAncestorsUseCase;
}
