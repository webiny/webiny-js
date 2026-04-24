import { createAbstraction } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";

export interface UpdateFlpParams {
    folder: Folder;
    queued?: string[];
    isCloseToTimeout?: () => boolean;
    handleTimeout?: (queued: string[]) => void;
}

// Use Case Abstraction
export interface IUpdateFlpUseCase {
    execute: (params: UpdateFlpParams) => Promise<void>;
}

/** Update a folder-level permission. */
export const UpdateFlpUseCase = createAbstraction<IUpdateFlpUseCase>("UpdateFlpUseCase");

export namespace UpdateFlpUseCase {
    export type Interface = IUpdateFlpUseCase;
}
