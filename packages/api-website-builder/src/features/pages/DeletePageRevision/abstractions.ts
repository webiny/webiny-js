import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PageNotFoundError } from "~/domain/page/errors.js";
import type { PagePersistenceError } from "~/domain/page/errors.js";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteWbPageRevisionParams {
    // The revision id, `<pageId>#<version>`.
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeletePageRevisionRepository {
    execute(params: IDeleteWbPageRevisionParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeletePageRevisionRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    IDeletePageRevisionRepositoryErrors[keyof IDeletePageRevisionRepositoryErrors];

export const DeletePageRevisionRepository = createAbstraction<IDeletePageRevisionRepository>(
    "Wb/DeletePageRevisionRepository"
);

export namespace DeletePageRevisionRepository {
    export type Interface = IDeletePageRevisionRepository;
    export type Params = IDeleteWbPageRevisionParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeletePageRevisionUseCase {
    execute(params: IDeleteWbPageRevisionParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeletePageRevisionUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IDeletePageRevisionUseCaseErrors[keyof IDeletePageRevisionUseCaseErrors];

/*
 * Delete one revision of a page. Deleting the latest revision makes the previous one the latest;
 * deleting the only revision deletes the page, and the page-delete events are published as well.
 */
export const DeletePageRevisionUseCase = createAbstraction<IDeletePageRevisionUseCase>(
    "Wb/DeletePageRevisionUseCase"
);

export namespace DeletePageRevisionUseCase {
    export type Interface = IDeletePageRevisionUseCase;
    export type Params = IDeleteWbPageRevisionParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface PageRevisionBeforeDeletePayload {
    page: WbPage;
}

export interface PageRevisionAfterDeletePayload {
    page: WbPage;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

// Hook into page lifecycle before a page revision is deleted.
export const PageRevisionBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>
>("Wb/PageRevisionBeforeDeleteEventHandler");

export namespace PageRevisionBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>;
    export type Event = DomainEvent<PageRevisionBeforeDeletePayload>;
    export type Page = WbPage;
}

// Hook into page lifecycle after a page revision is deleted.
export const PageRevisionAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>
>("Wb/PageRevisionAfterDeleteEventHandler");

export namespace PageRevisionAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>;
    export type Event = DomainEvent<PageRevisionAfterDeletePayload>;
    export type Page = WbPage;
}
