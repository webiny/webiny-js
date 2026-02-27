import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
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

export interface IDuplicatePageRepository {
    execute(params: IDuplicateWbPageParams): Promise<Result<WbPage, RepositoryError>>;
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

export const PageBeforeDuplicateHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeDuplicatePayload>>
>("Wb/PageBeforeDuplicateHandler");

export namespace PageBeforeDuplicateHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeDuplicatePayload>>;
    export type Event = DomainEvent<PageBeforeDuplicatePayload>;
    export type Page = WbPage;
}

export const PageAfterDuplicateHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterDuplicatePayload>>
>("Wb/PageAfterDuplicateHandler");

export namespace PageAfterDuplicateHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterDuplicatePayload>>;
    export type Event = DomainEvent<PageAfterDuplicatePayload>;
    export type Page = WbPage;
}
