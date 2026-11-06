import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import type {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError
} from "~/domain/page/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteWbPageRevisionParams {
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
    "Wb/Page/DeletePageRevisionRepository"
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

/** Delete a single page revision. */
export const DeletePageRevisionUseCase = createAbstraction<IDeletePageRevisionUseCase>(
    "Wb/Page/DeletePageRevisionUseCase"
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

/** Hook into page lifecycle before a page revision is deleted. */
export const PageRevisionBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>
>("Wb/Page/RevisionBeforeDeleteEventHandler");

export namespace PageRevisionBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionBeforeDeletePayload>>;
    export type Event = DomainEvent<PageRevisionBeforeDeletePayload>;
    export type Page = WbPage;
}

/** Hook into page lifecycle after a page revision is deleted. */
export const PageRevisionAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>
>("Wb/Page/RevisionAfterDeleteEventHandler");

export namespace PageRevisionAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<PageRevisionAfterDeletePayload>>;
    export type Event = DomainEvent<PageRevisionAfterDeletePayload>;
    export type Page = WbPage;
}
