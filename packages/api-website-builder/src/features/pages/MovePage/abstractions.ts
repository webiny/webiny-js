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

export interface IMoveWbPageParams {
    id: string;
    folderId: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IMovePageRepository {
    execute(params: IMoveWbPageParams): Promise<Result<WbPage, RepositoryError>>;
}

export interface IMovePageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IMovePageRepositoryErrors[keyof IMovePageRepositoryErrors];

export const MovePageRepository = createAbstraction<IMovePageRepository>("Wb/MovePageRepository");

export namespace MovePageRepository {
    export type Interface = IMovePageRepository;
    export type Params = IMoveWbPageParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IMovePageUseCase {
    execute(params: IMoveWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface IMovePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IMovePageUseCaseErrors[keyof IMovePageUseCaseErrors];

export const MovePageUseCase = createAbstraction<IMovePageUseCase>("Wb/MovePageUseCase");

export namespace MovePageUseCase {
    export type Interface = IMovePageUseCase;
    export type Params = IMoveWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeMovePayload {
    original: WbPage;
    input: IMoveWbPageParams;
}

export interface PageAfterMovePayload {
    original: WbPage;
    input: IMoveWbPageParams;
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeMoveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeMovePayload>>
>("Wb/PageBeforeMoveEventHandler");

export namespace PageBeforeMoveEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeMovePayload>>;
    export type Event = DomainEvent<PageBeforeMovePayload>;
    export type Page = WbPage;
}

export const PageAfterMoveEventHandler =
    createAbstraction<IEventHandler<DomainEvent<PageAfterMovePayload>>>("Wb/PageAfterMoveEventHandler");

export namespace PageAfterMoveEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterMovePayload>>;
    export type Event = DomainEvent<PageAfterMovePayload>;
    export type Page = WbPage;
}
