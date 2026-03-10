import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeletePageRepository {
    execute(params: IDeleteWbPageParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeletePageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IDeletePageRepositoryErrors[keyof IDeletePageRepositoryErrors];

export const DeletePageRepository =
    createAbstraction<IDeletePageRepository>("Wb/DeletePageRepository");

export namespace DeletePageRepository {
    export type Interface = IDeletePageRepository;
    export type Params = IDeleteWbPageParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeletePageUseCase {
    execute(params: IDeleteWbPageParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeletePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IDeletePageUseCaseErrors[keyof IDeletePageUseCaseErrors];

export const DeletePageUseCase = createAbstraction<IDeletePageUseCase>("Wb/DeletePageUseCase");

export namespace DeletePageUseCase {
    export type Interface = IDeletePageUseCase;
    export type Params = IDeleteWbPageParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeDeletePayload {
    page: WbPage;
}

export interface PageAfterDeletePayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeDeletePayload>>
>("Wb/PageBeforeDeleteEventHandler");

export namespace PageBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeDeletePayload>>;
    export type Event = DomainEvent<PageBeforeDeletePayload>;
    export type Page = WbPage;
}

export const PageAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterDeletePayload>>
>("Wb/PageAfterDeleteEventHandler");

export namespace PageAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterDeletePayload>>;
    export type Event = DomainEvent<PageAfterDeletePayload>;
    export type Page = WbPage;
}
