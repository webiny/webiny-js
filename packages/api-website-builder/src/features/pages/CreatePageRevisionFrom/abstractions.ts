import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { CreateWbPageRevisionFromParams } from "~/context/pages/pages.types.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreatePageRevisionFromRepository {
    execute(params: CreateWbPageRevisionFromParams): Promise<Result<WbPage, RepositoryError>>;
}

export interface ICreatePageRevisionFromRepositoryErrors {
    notFound: PageNotFoundError;
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    ICreatePageRevisionFromRepositoryErrors[keyof ICreatePageRevisionFromRepositoryErrors];

export const CreatePageRevisionFromRepository =
    createAbstraction<ICreatePageRevisionFromRepository>("CreatePageRevisionFromRepository");

export namespace CreatePageRevisionFromRepository {
    export type Interface = ICreatePageRevisionFromRepository;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreatePageRevisionFromUseCase {
    execute(params: CreateWbPageRevisionFromParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface ICreatePageRevisionFromUseCaseErrors {
    notFound: PageNotFoundError;
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type UseCaseError =
    ICreatePageRevisionFromUseCaseErrors[keyof ICreatePageRevisionFromUseCaseErrors];

export const CreatePageRevisionFromUseCase = createAbstraction<ICreatePageRevisionFromUseCase>(
    "CreatePageRevisionFromUseCase"
);

export namespace CreatePageRevisionFromUseCase {
    export type Interface = ICreatePageRevisionFromUseCase;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeCreateRevisionFromPayload {
    params: CreateWbPageRevisionFromParams;
}

export interface PageAfterCreateRevisionFromPayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

export const PageBeforeCreateRevisionFromHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>
>("PageBeforeCreateRevisionFromHandler");

export namespace PageBeforeCreateRevisionFromHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageBeforeCreateRevisionFromPayload>;
}

export const PageAfterCreateRevisionFromHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>
>("PageAfterCreateRevisionFromHandler");

export namespace PageAfterCreateRevisionFromHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterCreateRevisionFromPayload>>;
    export type Event = DomainEvent<PageAfterCreateRevisionFromPayload>;
}
