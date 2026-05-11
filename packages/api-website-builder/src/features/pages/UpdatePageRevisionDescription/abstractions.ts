import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";
// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUpdatePageRevisionDescriptionRepository {
    execute(
        id: string,
        revisionDescription: string | undefined
    ): Promise<Result<WbPage, RepositoryError>>;
}

export interface IUpdatePageRevisionDescriptionRepositoryErrors {
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    IUpdatePageRevisionDescriptionRepositoryErrors[keyof IUpdatePageRevisionDescriptionRepositoryErrors];

export const UpdatePageRevisionDescriptionRepository =
    createAbstraction<IUpdatePageRevisionDescriptionRepository>(
        "Wb/Page/UpdatePageRevisionDescriptionRepository"
    );

export namespace UpdatePageRevisionDescriptionRepository {
    export type Interface = IUpdatePageRevisionDescriptionRepository;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUpdatePageRevisionDescriptionUseCase {
    execute(
        id: string,
        revisionDescription: string | undefined
    ): Promise<Result<WbPage, UseCaseError>>;
}

export interface IUpdatePageRevisionDescriptionUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: PageValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError =
    IUpdatePageRevisionDescriptionUseCaseErrors[keyof IUpdatePageRevisionDescriptionUseCaseErrors];

/** Update a page. */
export const UpdatePageRevisionDescriptionUseCase =
    createAbstraction<IUpdatePageRevisionDescriptionUseCase>(
        "Wb/Page/UpdatePageRevisionDescriptionUseCase"
    );

export namespace UpdatePageRevisionDescriptionUseCase {
    export type Interface = IUpdatePageRevisionDescriptionUseCase;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageBeforeUpdateRevisionDescriptionPayload {
    original: WbPage;
    input: {
        id: string;
        revisionDescription: string | undefined;
    };
}

export interface PageAfterUpdateRevisionDescriptionPayload {
    original: WbPage;
    input: {
        id: string;
        revisionDescription: string | undefined;
    };
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into page lifecycle before a page is updated. */
export const PageBeforeUpdateRevisionDescriptionEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageBeforeUpdateRevisionDescriptionPayload>>
>("Wb/Page/BeforeUpdateRevisionDescriptionEventHandler");

export namespace PageBeforeUpdateRevisionDescriptionEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageBeforeUpdateRevisionDescriptionPayload>>;
    export type Event = DomainEvent<PageBeforeUpdateRevisionDescriptionPayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page is updated. */
export const PageAfterUpdateRevisionDescriptionEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageAfterUpdateRevisionDescriptionPayload>>
>("Wb/Page/AfterUpdateRevisionDescriptionEventHandler");

export namespace PageAfterUpdateRevisionDescriptionEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageAfterUpdateRevisionDescriptionPayload>>;
    export type Event = DomainEvent<PageAfterUpdateRevisionDescriptionPayload>;
    export type Page = WbPage;
}
