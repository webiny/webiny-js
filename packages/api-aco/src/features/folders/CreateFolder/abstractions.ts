import { createAbstraction } from "@webiny/feature";
import type { DomainEvent, IEventHandler } from "@webiny/api-core";
import type { Folder, CreateFolderParams } from "~/folder/folder.types.js";

// Use Case Abstraction
export interface ICreateFolderUseCase {
    execute: (params: CreateFolderParams) => Promise<Folder>;
}

export const CreateFolderUseCase = createAbstraction<ICreateFolderUseCase>("CreateFolderUseCase");

export namespace CreateFolderUseCase {
    export type Interface = ICreateFolderUseCase;
}

// Event Payload Types
export interface FolderBeforeCreatePayload {
    input: CreateFolderParams;
}

export interface FolderAfterCreatePayload {
    folder: Folder;
}

// Event Handler Abstractions
export const FolderBeforeCreateHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeCreatePayload>>
>("FolderBeforeCreateHandler");

export const FolderAfterCreateHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterCreatePayload>>
>("FolderAfterCreateHandler");
