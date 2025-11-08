import { createAbstraction } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IDeleteFlpUseCase {
    execute: (folder: Folder) => Promise<void>;
}

export const DeleteFlpUseCase = createAbstraction<IDeleteFlpUseCase>("DeleteFlpUseCase");

export namespace DeleteFlpUseCase {
    export type Interface = IDeleteFlpUseCase;
}
