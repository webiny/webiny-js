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

export interface IPublishWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IPublishPageRepository {
    execute(params: IPublishWbPageParams): Promise<Result<WbPage, RepositoryError>>;
}

export interface IPublishPageRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IPublishPageRepositoryErrors[keyof IPublishPageRepositoryErrors];

export const PublishPageRepository = createAbstraction<IPublishPageRepository>(
    "Wb/PublishPageRepository"
);

export namespace PublishPageRepository {
    export type Interface = IPublishPageRepository;
    export type Params = IPublishWbPageParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IPublishPageUseCase {
    execute(params: IPublishWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface IPublishPageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IPublishPageUseCaseErrors[keyof IPublishPageUseCaseErrors];

export const PublishPageUseCase = createAbstraction<IPublishPageUseCase>("Wb/PublishPageUseCase");

export namespace PublishPageUseCase {
    export type Interface = IPublishPageUseCase;
    export type Params = IPublishWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforePublishPayload {
    page: WbPage;
}

export interface PageAfterPublishPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforePublishHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforePublishPayload>>
>("Wb/PageBeforePublishHandler");

export namespace PageBeforePublishHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforePublishPayload>>;
    export type Event = DomainEvent<PageBeforePublishPayload>;
    export type Page = WbPage;
}

export const PageAfterPublishHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterPublishPayload>>
>("Wb/PageAfterPublishHandler");

export namespace PageAfterPublishHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterPublishPayload>>;
    export type Event = DomainEvent<PageAfterPublishPayload>;
    export type Page = WbPage;
}
