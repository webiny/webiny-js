import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsEntryWbPage, WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ICreateWbPageRevisionFromParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreatePageRevisionFromRepositoryParams extends ICreateWbPageRevisionFromParams {
    /**
     * The values to create the new revision with. They can differ from the source revision's
     * after `page.beforeCreateRevisionFrom`.
     */
    values: CmsEntryWbPage;
}

export interface ICreatePageRevisionFromRepository {
    execute(
        params: ICreatePageRevisionFromRepositoryParams
    ): Promise<Result<WbPage, RepositoryError>>;
}

export interface ICreatePageRevisionFromRepositoryErrors {
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    ICreatePageRevisionFromRepositoryErrors[keyof ICreatePageRevisionFromRepositoryErrors];

export const CreatePageRevisionFromRepository =
    createAbstraction<ICreatePageRevisionFromRepository>("Wb/CreatePageRevisionFromRepository");

export namespace CreatePageRevisionFromRepository {
    export type Interface = ICreatePageRevisionFromRepository;
    export type Params = ICreatePageRevisionFromRepositoryParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreatePageRevisionFromUseCase {
    execute(params: ICreateWbPageRevisionFromParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface ICreatePageRevisionFromUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError =
    ICreatePageRevisionFromUseCaseErrors[keyof ICreatePageRevisionFromUseCaseErrors];

/** Create a page revision from an existing one. */
export const CreatePageRevisionFromUseCase = createAbstraction<ICreatePageRevisionFromUseCase>(
    "Wb/CreatePageRevisionFromUseCase"
);

export namespace CreatePageRevisionFromUseCase {
    export type Interface = ICreatePageRevisionFromUseCase;
    export type Params = ICreateWbPageRevisionFromParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeCreateRevisionFromPayload {
    params: ICreateWbPageRevisionFromParams;
    /** The revision the new one is created from. */
    original: WbPage;
    /**
     * What the new revision is created with. Starts as a copy of `original`; handlers can edit it.
     */
    page: WbPage;
}

export interface PageAfterCreateRevisionFromPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into page lifecycle before a revision is created from existing. */
export const PageBeforeCreateRevisionFromEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>
>("Wb/PageBeforeCreateRevisionFromEventHandler");

export namespace PageBeforeCreateRevisionFromEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageBeforeCreateRevisionFromPayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a revision is created from existing. */
export const PageAfterCreateRevisionFromEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>
>("Wb/PageAfterCreateRevisionFromEventHandler");

export namespace PageAfterCreateRevisionFromEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageAfterCreateRevisionFromPayload>;
    export type Page = WbPage;
}
