import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IUpdateFolderUseCase {
    execute: (id: string, data: UpdateFolderParams) => Promise<Folder>;
}

export const UpdateFolderUseCase = createAbstraction<IUpdateFolderUseCase>("UpdateFolderUseCase");

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
export const FolderBeforeUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeUpdatePayload>>
>("FolderBeforeUpdateHandler");

export namespace FolderBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeUpdatePayload>>;
}

export const FolderAfterUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterUpdatePayload>>
>("FolderAfterUpdateHandler");

export namespace FolderAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterUpdatePayload>>;
}
