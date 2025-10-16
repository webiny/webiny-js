import { Abstraction } from "@webiny/di-container";
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

export const UpdateFlpUseCase = new Abstraction<IUpdateFlpUseCase>("UpdateFlpUseCase");

export namespace UpdateFlpUseCase {
    export type Interface = IUpdateFlpUseCase;
}
