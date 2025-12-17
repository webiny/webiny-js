import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Folder, GetFolderParams } from "~/folder/folder.types.js";
import type {
    FolderNotAuthorizedError,
    FolderNotFoundError,
    FolderPersistenceError
} from "~/domain/folder/errors.js";

/**
 * GetFolder repository interface
 */
export interface IGetFolderRepository {
    execute(id: string): Promise<Result<Folder, RepositoryError>>;
}

export interface IGetFolderRepositoryErrors {
    notFound: FolderNotFoundError;
    persistence: FolderPersistenceError;
}

type RepositoryError = IGetFolderRepositoryErrors[keyof IGetFolderRepositoryErrors];

export const GetFolderRepository = createAbstraction<IGetFolderRepository>("GetFolderRepository");

export namespace GetFolderRepository {
    export type Interface = IGetFolderRepository;
    export type Error = RepositoryError;
}

/**
 * GetFolder use case interface
 */
export interface IGetFolderUseCase {
    execute(id: string): Promise<Result<Folder, UseCaseError>>;
}

export interface IGetFolderUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    notFound: FolderNotFoundError;
    persistence: FolderPersistenceError;
}

type UseCaseError = IGetFolderUseCaseErrors[keyof IGetFolderUseCaseErrors];

export const GetFolderUseCase = createAbstraction<IGetFolderUseCase>("GetFolderUseCase");

export namespace GetFolderUseCase {
    export type Interface = IGetFolderUseCase;
    export type Error = UseCaseError;
}

// Event Payload Types
export interface FolderBeforeGetPayload {
    params: GetFolderParams;
}

export interface FolderAfterGetPayload {
    folder: Folder;
}

// Event Handler Abstractions
export const FolderBeforeGetHandler =
    createAbstraction<IEventHandler<DomainEvent<FolderBeforeGetPayload>>>("FolderBeforeGetHandler");

export namespace FolderBeforeGetHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeGetPayload>>;
    export type Event = DomainEvent<FolderBeforeGetPayload>;
}

export const FolderAfterGetHandler =
    createAbstraction<IEventHandler<DomainEvent<FolderAfterGetPayload>>>("FolderAfterGetHandler");

export namespace FolderAfterGetHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterGetPayload>>;
    export type Event = DomainEvent<FolderAfterGetPayload>;
}
