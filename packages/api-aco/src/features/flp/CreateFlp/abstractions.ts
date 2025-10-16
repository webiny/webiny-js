import { createAbstraction } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface ICreateFlpUseCase {
    execute: (folder: Folder) => Promise<void>;
}

export const CreateFlpUseCase = createAbstraction<ICreateFlpUseCase>("CreateFlpUseCase");

export namespace CreateFlpUseCase {
    export type Interface = ICreateFlpUseCase;
}
