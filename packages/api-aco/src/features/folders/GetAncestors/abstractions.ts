import { createAbstraction } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface GetAncestorsParams {
    folder: Folder;
}

export interface IGetAncestorsUseCase {
    execute: (params: GetAncestorsParams) => Promise<Folder[]>;
}

export const GetAncestorsUseCase = createAbstraction<IGetAncestorsUseCase>("GetAncestorsUseCase");

export namespace GetAncestorsUseCase {
    export type Interface = IGetAncestorsUseCase;
}
