import { Abstraction } from "@webiny/di-container";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface ICreateFlpUseCase {
    execute: (folder: Folder) => Promise<void>;
}

export const CreateFlpUseCase = new Abstraction<ICreateFlpUseCase>("CreateFlpUseCase");

export namespace CreateFlpUseCase {
    export type Interface = ICreateFlpUseCase;
}
