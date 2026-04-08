import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageValidationError,
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDuplicateWbPageParams {
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export type DuplicatePageData = Pick<
    WbPage,
    "bindings" | "elements" | "location" | "properties" | "metadata" | "extensions"
>;

export interface DuplicatePageCallbackParams {
    original: WbPage;
    duplicate: DuplicatePageData;
}

export type DuplicatePageCallback = (params: DuplicatePageCallbackParams) => Promise<void> | void;

export interface IDuplicatePageRepository {
    execute(
        params: IDuplicateWbPageParams,
        callback?: DuplicatePageCallback
    ): Promise<Result<WbPage, RepositoryError>>;
}

export interface IDuplicatePageRepositoryErrors {
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IDuplicatePageRepositoryErrors[keyof IDuplicatePageRepositoryErrors];

export const DuplicatePageRepository = createAbstraction<IDuplicatePageRepository>(
    "Wb/DuplicatePageRepository"
);

export namespace DuplicatePageRepository {
    export type Interface = IDuplicatePageRepository;
    export type Params = IDuplicateWbPageParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDuplicatePageUseCase {
    execute(params: IDuplicateWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface IDuplicatePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IDuplicatePageUseCaseErrors[keyof IDuplicatePageUseCaseErrors];

/** Duplicate a page. */
export const DuplicatePageUseCase =
    createAbstraction<IDuplicatePageUseCase>("Wb/DuplicatePageUseCase");

export namespace DuplicatePageUseCase {
    export type Interface = IDuplicatePageUseCase;
    export type Params = IDuplicateWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeDuplicatePayload {
    original: WbPage;
}

export interface PageAfterDuplicatePayload {
    original: WbPage;
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into page lifecycle before a page is duplicated. */
export const PageBeforeDuplicateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeDuplicatePayload>>
>("Wb/PageBeforeDuplicateEventHandler");

export namespace PageBeforeDuplicateEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeDuplicatePayload>>;
    export type Event = DomainEvent<PageBeforeDuplicatePayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page is duplicated. */
export const PageAfterDuplicateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterDuplicatePayload>>
>("Wb/PageAfterDuplicateEventHandler");

export namespace PageAfterDuplicateEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterDuplicatePayload>>;
    export type Event = DomainEvent<PageAfterDuplicatePayload>;
    export type Page = WbPage;
}
