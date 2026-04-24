import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
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

/** Retrieve a folder. */
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
/** Hook into folder lifecycle before a folder is retrieved. */
export const FolderBeforeGetEventHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderBeforeGetPayload>>
>("FolderBeforeGetEventHandler");

export namespace FolderBeforeGetEventHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeGetPayload>>;
    export type Event = DomainEvent<FolderBeforeGetPayload>;
}

/** Hook into folder lifecycle after a folder is retrieved. */
export const FolderAfterGetEventHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterGetPayload>>
>("FolderAfterGetEventHandler");

export namespace FolderAfterGetEventHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterGetPayload>>;
    export type Event = DomainEvent<FolderAfterGetPayload>;
}
