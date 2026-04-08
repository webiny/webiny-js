import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PagePersistenceError,
    PageValidationError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

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
    createAbstraction<ICreatePageRepository>("Wb/CreatePageRepository");

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
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    persistence: PagePersistenceError;
}

type UseCaseError = ICreatePageUseCaseErrors[keyof ICreatePageUseCaseErrors];

/** Create a new page. */
export const CreatePageUseCase = createAbstraction<ICreatePageUseCase>("Wb/CreatePageUseCase");

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

/** Hook into page lifecycle before a page is created. */
export const PageBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeCreatePayload>>
>("Wb/PageBeforeCreateEventHandler");

export namespace PageBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeCreatePayload>>;
    export type Event = DomainEvent<PageBeforeCreatePayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page is created. */
export const PageAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterCreatePayload>>
>("Wb/PageAfterCreateEventHandler");

export namespace PageAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterCreatePayload>>;
    export type Event = DomainEvent<PageAfterCreatePayload>;
    export type Page = WbPage;
}
