import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { WbLocation } from "~/domain/shared/abstractions.js";
import type { IEntryState } from "@webiny/api-headless-cms/types/index.js";
import {
    PageValidationError,
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IUpdateWbPageData {
    location?: WbLocation;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    // Workflows - remove when workflows are more generic
    state?: Partial<IEntryState>;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUpdatePageRepository {
    execute(id: string, data: IUpdateWbPageData): Promise<Result<WbPage, RepositoryError>>;
}

export interface IUpdatePageRepositoryErrors {
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IUpdatePageRepositoryErrors[keyof IUpdatePageRepositoryErrors];

export const UpdatePageRepository =
    createAbstraction<IUpdatePageRepository>("Wb/UpdatePageRepository");

export namespace UpdatePageRepository {
    export type Interface = IUpdatePageRepository;
    export type UpdateData = IUpdateWbPageData;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUpdatePageUseCase {
    execute(id: string, data: IUpdateWbPageData): Promise<Result<WbPage, UseCaseError>>;
}

export interface IUpdatePageUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IUpdatePageUseCaseErrors[keyof IUpdatePageUseCaseErrors];

export const UpdatePageUseCase = createAbstraction<IUpdatePageUseCase>("Wb/UpdatePageUseCase");

export namespace UpdatePageUseCase {
    export type Interface = IUpdatePageUseCase;
    export type UpdateData = IUpdateWbPageData;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeUpdatePayload {
    original: WbPage;
    input: {
        id: string;
        data: IUpdateWbPageData;
    };
}

export interface PageAfterUpdatePayload {
    original: WbPage;
    input: {
        id: string;
        data: IUpdateWbPageData;
    };
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeUpdatePayload>>
>("Wb/PageBeforeUpdateHandler");

export namespace PageBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeUpdatePayload>>;
    export type Event = DomainEvent<PageBeforeUpdatePayload>;
    export type Page = WbPage;
}

export const PageAfterUpdateHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterUpdatePayload>>
>("Wb/PageAfterUpdateHandler");

export namespace PageAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterUpdatePayload>>;
    export type Event = DomainEvent<PageAfterUpdatePayload>;
    export type Page = WbPage;
}
