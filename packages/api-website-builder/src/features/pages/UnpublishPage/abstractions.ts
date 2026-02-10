import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IUnpublishWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUnpublishPageRepository {
    execute(params: IUnpublishWbPageParams): Promise<Result<WbPage, RepositoryError>>;
}

export interface IUnpublishPageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IUnpublishPageRepositoryErrors[keyof IUnpublishPageRepositoryErrors];

export const UnpublishPageRepository =
    createAbstraction<IUnpublishPageRepository>("UnpublishPageRepository");

export namespace UnpublishPageRepository {
    export type Interface = IUnpublishPageRepository;
    export type Params = IUnpublishWbPageParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUnpublishPageUseCase {
    execute(params: IUnpublishWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface IUnpublishPageUseCaseErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IUnpublishPageUseCaseErrors[keyof IUnpublishPageUseCaseErrors];

export const UnpublishPageUseCase =
    createAbstraction<IUnpublishPageUseCase>("UnpublishPageUseCase");

export namespace UnpublishPageUseCase {
    export type Interface = IUnpublishPageUseCase;
    export type Params = IUnpublishWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeUnpublishPayload {
    page: WbPage;
}

export interface PageAfterUnpublishPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeUnpublishHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeUnpublishPayload>>
>("PageBeforeUnpublishHandler");

export namespace PageBeforeUnpublishHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeUnpublishPayload>>;
    export type Event = DomainEvent<PageBeforeUnpublishPayload>;
}

export const PageAfterUnpublishHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterUnpublishPayload>>
>("PageAfterUnpublishHandler");

export namespace PageAfterUnpublishHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterUnpublishPayload>>;
    export type Event = DomainEvent<PageAfterUnpublishPayload>;
}
