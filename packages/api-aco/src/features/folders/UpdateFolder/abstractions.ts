import { Abstraction } from "@webiny/di-container";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IUpdateFolderUseCase {
    execute: (id: string, data: UpdateFolderParams) => Promise<Folder>;
}

export const UpdateFolderUseCase = new Abstraction<IUpdateFolderUseCase>("UpdateFolderUseCase");

export namespace UpdateFolderUseCase {
    export type Interface = IUpdateFolderUseCase;
}

// Event Payload Types
export interface FolderBeforeUpdatePayload {
    original: Folder;
    input: Record<string, any>;
}

export interface FolderAfterUpdatePayload {
    original: Folder;
    folder: Folder;
    input: Record<string, any>;
}

// Event Handler Abstractions
export const FolderBeforeUpdateHandler = new Abstraction<
    IEventHandler<DomainEvent<FolderBeforeUpdatePayload>>
>("FolderBeforeUpdateHandler");

export const FolderAfterUpdateHandler = new Abstraction<
    IEventHandler<DomainEvent<FolderAfterUpdatePayload>>
>("FolderAfterUpdateHandler");
