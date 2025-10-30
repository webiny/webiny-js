import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
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

export namespace FolderBeforeDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeDeletePayload>>;
    export type Event = DomainEvent<FolderBeforeDeletePayload>;
}

export const FolderAfterDeleteHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterDeletePayload>>
>("FolderAfterDeleteHandler");

export namespace FolderAfterDeleteHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterDeletePayload>>;
    export type Event = DomainEvent<FolderAfterDeletePayload>;
}
