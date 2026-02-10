import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import { PagePersistenceError, PageValidationError } from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export type ICreateWbPageParams = Pick<
    WbPage,
    "properties" | "metadata" | "bindings" | "elements" | "location" | "extensions"
>;

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreatePageRepository {
    execute(data: ICreateWbPageParams): Promise<Result<WbPage, RepositoryError>>;
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
    export type Params = ICreateWbPageParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreatePageUseCase {
    execute(data: ICreateWbPageParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface ICreatePageUseCaseErrors {
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type UseCaseError = ICreatePageUseCaseErrors[keyof ICreatePageUseCaseErrors];

export const CreatePageUseCase = createAbstraction<ICreatePageUseCase>("CreatePageUseCase");

export namespace CreatePageUseCase {
    export type Interface = ICreatePageUseCase;
    export type Params = ICreateWbPageParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeCreatePayload {
    input: ICreateWbPageParams;
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
