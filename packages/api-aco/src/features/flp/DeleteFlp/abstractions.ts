import { Abstraction } from "@webiny/di-container";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IDeleteFlpUseCase {
    execute: (folder: Folder) => Promise<void>;
}

export const DeleteFlpUseCase = new Abstraction<IDeleteFlpUseCase>("DeleteFlpUseCase");

export namespace DeleteFlpUseCase {
    export type Interface = IDeleteFlpUseCase;
}
