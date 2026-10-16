import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsEntryWbPage, WbPage } from "~/domain/page/abstractions.js";
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

export interface IPublishPageRepositoryParams extends IPublishWbPageParams {
    /** The page values to publish. They can differ from the stored ones after `page.beforePublish`. */
    values: CmsEntryWbPage;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IPublishPageRepository {
    execute(params: IPublishPageRepositoryParams): Promise<Result<WbPage, RepositoryError>>;
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
    export type Params = IPublishPageRepositoryParams;
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

/** Publish a page. */
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
    /** The stored revision being published. */
    original: WbPage;
    /** What gets published. Starts as a copy of `original`; handlers can edit it. */
    page: WbPage;
}

export interface PageAfterPublishPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into page lifecycle before a page is published. */
export const PageBeforePublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforePublishPayload>>
>("Wb/PageBeforePublishEventHandler");

export namespace PageBeforePublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforePublishPayload>>;
    export type Event = DomainEvent<PageBeforePublishPayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page is published. */
export const PageAfterPublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterPublishPayload>>
>("Wb/PageAfterPublishEventHandler");

export namespace PageAfterPublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterPublishPayload>>;
    export type Event = DomainEvent<PageAfterPublishPayload>;
    export type Page = WbPage;
}
