import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
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

export interface ICreatePageRevisionFromRepository {
    execute(params: ICreateWbPageRevisionFromParams): Promise<Result<WbPage, RepositoryError>>;
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
    export type Params = ICreateWbPageRevisionFromParams;
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
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError =
    ICreatePageRevisionFromUseCaseErrors[keyof ICreatePageRevisionFromUseCaseErrors];

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
}

export interface PageAfterCreateRevisionFromPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeCreateRevisionFromHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>
>("Wb/PageBeforeCreateRevisionFromHandler");

export namespace PageBeforeCreateRevisionFromHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageBeforeCreateRevisionFromPayload>;
    export type Page = WbPage;
}

export const PageAfterCreateRevisionFromHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>
>("Wb/PageAfterCreateRevisionFromHandler");

export namespace PageAfterCreateRevisionFromHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageAfterCreateRevisionFromPayload>;
    export type Page = WbPage;
}
