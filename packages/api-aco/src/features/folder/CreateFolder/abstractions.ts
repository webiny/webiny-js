import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Folder, CreateFolderParams } from "~/folder/folder.types.js";
import type {
    FolderNotAuthorizedError,
    FolderPersistenceError,
    FolderValidationError
} from "~/domain/folder/errors.js";

/**
 * CreateFolder repository interface
 */
export interface ICreateFolderRepository {
    execute(data: CreateFolderParams): Promise<Result<Folder, RepositoryError>>;
}

export interface ICreateFolderRepositoryErrors {
    validation: FolderValidationError;
    persistence: FolderPersistenceError;
}

type RepositoryError = ICreateFolderRepositoryErrors[keyof ICreateFolderRepositoryErrors];

export const CreateFolderRepository =
    createAbstraction<ICreateFolderRepository>("CreateFolderRepository");

export namespace CreateFolderRepository {
    export type Interface = ICreateFolderRepository;
    export type Error = RepositoryError;
}

/**
 * CreateFolder use case interface
 */
export interface ICreateFolderUseCase {
    execute(params: CreateFolderParams): Promise<Result<Folder, UseCaseError>>;
}

export interface ICreateFolderUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    persistence: FolderPersistenceError;
    validation: FolderValidationError;
}

type UseCaseError = ICreateFolderUseCaseErrors[keyof ICreateFolderUseCaseErrors];

export const CreateFolderUseCase = createAbstraction<ICreateFolderUseCase>("CreateFolderUseCase");

export namespace CreateFolderUseCase {
    export type Interface = ICreateFolderUseCase;
    export type Return = Promise<Result<Folder, UseCaseError>>;
    export type Error = UseCaseError;
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

export namespace FolderBeforeCreateHandler {
    export type Interface = IEventHandler<DomainEvent<FolderBeforeCreatePayload>>;
    export type Event = DomainEvent<FolderBeforeCreatePayload>;
}

export const FolderAfterCreateHandler = createAbstraction<
    IEventHandler<DomainEvent<FolderAfterCreatePayload>>
>("FolderAfterCreateHandler");

export namespace FolderAfterCreateHandler {
    export type Interface = IEventHandler<DomainEvent<FolderAfterCreatePayload>>;
    export type Event = DomainEvent<FolderAfterCreatePayload>;
}
