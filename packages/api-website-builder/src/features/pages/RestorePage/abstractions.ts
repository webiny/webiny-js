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

export interface IRestoreWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IRestorePageRepository {
    execute(params: IRestoreWbPageParams): Promise<Result<void, RepositoryError>>;
}

export interface IRestorePageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IRestorePageRepositoryErrors[keyof IRestorePageRepositoryErrors];

export const RestorePageRepository = createAbstraction<IRestorePageRepository>(
    "Wb/RestorePageRepository"
);

export namespace RestorePageRepository {
    export type Interface = IRestorePageRepository;
    export type Params = IRestoreWbPageParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IRestorePageUseCase {
    execute(params: IRestoreWbPageParams): Promise<Result<void, UseCaseError>>;
}

export interface IRestorePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IRestorePageUseCaseErrors[keyof IRestorePageUseCaseErrors];

export const RestorePageUseCase = createAbstraction<IRestorePageUseCase>("Wb/RestorePageUseCase");

export namespace RestorePageUseCase {
    export type Interface = IRestorePageUseCase;
    export type Params = IRestoreWbPageParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeRestorePayload {
    page: WbPage;
}

export interface PageAfterRestorePayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeRestoreEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeRestorePayload>>
>("Wb/PageBeforeRestoreEventHandler");

export namespace PageBeforeRestoreEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeRestorePayload>>;
    export type Event = DomainEvent<PageBeforeRestorePayload>;
    export type Page = WbPage;
}

export const PageAfterRestoreEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterRestorePayload>>
>("Wb/PageAfterRestoreEventHandler");

export namespace PageAfterRestoreEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterRestorePayload>>;
    export type Event = DomainEvent<PageAfterRestorePayload>;
    export type Page = WbPage;
}
