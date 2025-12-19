import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { CreateWbPageData } from "~/context/pages/pages.types.js";
import { PagePersistenceError, PageValidationError } from "~/domain/page/errors.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreatePageRepository {
    execute(data: CreateWbPageData): Promise<Result<WbPage, RepositoryError>>;
}

export interface ICreatePageRepositoryErrors {
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type RepositoryError = ICreatePageRepositoryErrors[keyof ICreatePageRepositoryErrors];

export const CreatePageRepository =
    createAbstraction<ICreatePageRepository>("CreatePageRepository");

export namespace CreatePageRepository {
    export type Interface = ICreatePageRepository;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreatePageUseCase {
    execute(data: CreateWbPageData): Promise<Result<WbPage, UseCaseError>>;
}

export interface ICreatePageUseCaseErrors {
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type UseCaseError = ICreatePageUseCaseErrors[keyof ICreatePageUseCaseErrors];

export const CreatePageUseCase = createAbstraction<ICreatePageUseCase>("CreatePageUseCase");

export namespace CreatePageUseCase {
    export type Interface = ICreatePageUseCase;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeCreatePayload {
    input: CreateWbPageData;
}

export interface PageAfterCreatePayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeCreateHandler =
    createAbstraction<IEventHandler<DomainEvent<PageBeforeCreatePayload>>>(
        "PageBeforeCreateHandler"
    );

export namespace PageBeforeCreateHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeCreatePayload>>;
    export type Event = DomainEvent<PageBeforeCreatePayload>;
}

export const PageAfterCreateHandler =
    createAbstraction<IEventHandler<DomainEvent<PageAfterCreatePayload>>>("PageAfterCreateHandler");

export namespace PageAfterCreateHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterCreatePayload>>;
    export type Event = DomainEvent<PageAfterCreatePayload>;
}
