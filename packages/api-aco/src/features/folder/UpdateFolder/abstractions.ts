import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";
import {
    FolderCannotMoveToNewParent,
    type FolderNotAuthorizedError,
    type FolderNotFoundError,
    type FolderPersistenceError,
    type FolderValidationError
} from "~/domain/folder/errors.js";

/**
 * UpdateFolder repository interface
 */
export interface IUpdateFolderRepository {
    execute(id: string, data: UpdateFolderParams): Promise<Result<Folder, RepositoryError>>;
}

export interface IUpdateFolderRepositoryErrors {
    persistence: FolderPersistenceError;
    validation: FolderValidationError;
}

type RepositoryError = IUpdateFolderRepositoryErrors[keyof IUpdateFolderRepositoryErrors];

/** Persist folder updates. */
export const UpdateFolderRepository =
    createAbstraction<IUpdateFolderRepository>("UpdateFolderRepository");

export namespace UpdateFolderRepository {
    export type Interface = IUpdateFolderRepository;
    export type Error = RepositoryError;
}

/**
 * UpdateFolder use case interface
 */
export interface IUpdateFolderUseCase {
    execute(id: string, data: UpdateFolderParams): Promise<Result<Folder, UseCaseError>>;
}

export interface IUpdateFolderUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    notFound: FolderNotFoundError;
    cannotMoveToNewParent: FolderCannotMoveToNewParent;
    persistence: FolderPersistenceError;
    validation: FolderValidationError;
}

type UseCaseError = IUpdateFolderUseCaseErrors[keyof IUpdateFolderUseCaseErrors];

/** Update a folder. */
export const UpdateFolderUseCase = createAbstraction<IUpdateFolderUseCase>("UpdateFolderUseCase");

export namespace UpdateFolderUseCase {
    export type Interface = IUpdateFolderUseCase;
    export type Return = Promise<Result<Folder, UseCaseError>>;
    export type Error = UseCaseError;
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
/** Hook into folder lifecycle before a folder is updated. */
export const FolderBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeUpdatePayload>>
>("FolderBeforeUpdateEventHandler");

export namespace FolderBeforeUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeUpdatePayload>>;
    export type Event = DomainEvent<FolderBeforeUpdatePayload>;
}

/** Hook into folder lifecycle after a folder is updated. */
export const FolderAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterUpdatePayload>>
>("FolderAfterUpdateEventHandler");

export namespace FolderAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterUpdatePayload>>;
    export type Event = DomainEvent<FolderAfterUpdatePayload>;
}
