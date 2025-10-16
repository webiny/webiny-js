import { createAbstraction } from "@webiny/feature";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import type { Folder, DeleteFolderParams } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IDeleteFolderUseCase {
    execute: (params: DeleteFolderParams) => Promise<boolean>;
}

export const DeleteFolderUseCase = createAbstraction<IDeleteFolderUseCase>("DeleteFolderUseCase");

export namespace DeleteFolderUseCase {
    export type Interface = IDeleteFolderUseCase;
}

// Event Payload Types
export interface FolderBeforeDeletePayload {
    folder: Folder;
}

export interface FolderAfterDeletePayload {
    folder: Folder;
}

// Event Handler Abstractions
export const FolderBeforeDeleteHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeDeletePayload>>
>("FolderBeforeDeleteHandler");

export const FolderAfterDeleteHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterDeletePayload>>
>("FolderAfterDeleteHandler");
