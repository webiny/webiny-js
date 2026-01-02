import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Folder } from "~/folder/folder.types.js";
import {
    type FolderNotAuthorizedError,
    FolderNotEmptyError,
    type FolderNotFoundError,
    type FolderPersistenceError
} from "~/domain/folder/errors.js";

/**
 * DeleteFolder repository interface
 */
export interface IDeleteFolderRepository {
    execute(folder: Folder): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteFolderRepositoryErrors {
    notAuthorized: FolderNotAuthorizedError;
    persistence: FolderPersistenceError;
}

type RepositoryError = IDeleteFolderRepositoryErrors[keyof IDeleteFolderRepositoryErrors];

export const DeleteFolderRepository =
    createAbstraction<IDeleteFolderRepository>("DeleteFolderRepository");

export namespace DeleteFolderRepository {
    export type Interface = IDeleteFolderRepository;
    export type Error = RepositoryError;
}

/**
 * DeleteFolder use case interface
 */
export interface IDeleteFolderUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteFolderUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    notFound: FolderNotFoundError;
    notEmpty: FolderNotEmptyError;
    persistence: FolderPersistenceError;
}

type UseCaseError = IDeleteFolderUseCaseErrors[keyof IDeleteFolderUseCaseErrors];

export const DeleteFolderUseCase = createAbstraction<IDeleteFolderUseCase>("DeleteFolderUseCase");

export namespace DeleteFolderUseCase {
    export type Interface = IDeleteFolderUseCase;
    export type Error = UseCaseError;
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
