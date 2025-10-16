import { createAbstraction } from "@webiny/feature";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import type { Folder, GetFolderParams } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IGetFolderUseCase {
    execute: (params: GetFolderParams) => Promise<Folder>;
}

export const GetFolderUseCase = createAbstraction<IGetFolderUseCase>("GetFolderUseCase");

export namespace GetFolderUseCase {
    export type Interface = IGetFolderUseCase;
}

// Event Payload Types
export interface FolderBeforeGetPayload {
    params: GetFolderParams;
}

export interface FolderAfterGetPayload {
    folder: Folder;
}

// Event Handler Abstractions
export const FolderBeforeGetHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeGetPayload>>
>("FolderBeforeGetHandler");

export const FolderAfterGetHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterGetPayload>>
>("FolderAfterGetHandler");
