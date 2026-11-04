import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutInUseError,
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDeleteLayoutRevisionParams {
    // A revision id.
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeleteLayoutRevisionRepository {
    execute(id: string): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteLayoutRevisionRepositoryErrors {
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type RepositoryError =
    IDeleteLayoutRevisionRepositoryErrors[keyof IDeleteLayoutRevisionRepositoryErrors];

/** Delete a layout revision from storage. Replace it to keep layouts elsewhere. */
export const DeleteLayoutRevisionRepository = createAbstraction<IDeleteLayoutRevisionRepository>(
    "Wb/DeleteLayoutRevisionRepository"
);

export namespace DeleteLayoutRevisionRepository {
    export type Interface = IDeleteLayoutRevisionRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<void, RepositoryError>>;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeleteLayoutRevisionUseCase {
    execute(params: IDeleteLayoutRevisionParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteLayoutRevisionUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    inUse: LayoutInUseError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IDeleteLayoutRevisionUseCaseErrors[keyof IDeleteLayoutRevisionUseCaseErrors];

/** Delete a layout revision. Deleting the published revision fails with a `LayoutInUseError` while the layout is in use; deleting the only revision deletes the layout. */
export const DeleteLayoutRevisionUseCase = createAbstraction<IDeleteLayoutRevisionUseCase>(
    "Wb/DeleteLayoutRevisionUseCase"
);

export namespace DeleteLayoutRevisionUseCase {
    export type Interface = IDeleteLayoutRevisionUseCase;
    export type Params = IDeleteLayoutRevisionParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutRevisionBeforeDeletePayload {
    layout: WbLayout;
}

export interface LayoutRevisionAfterDeletePayload {
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a layout revision is deleted. */
export const LayoutRevisionBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutRevisionBeforeDeletePayload>>
>("Wb/LayoutRevisionBeforeDeleteEventHandler");

export namespace LayoutRevisionBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutRevisionBeforeDeletePayload>>;
    export type Event = DomainEvent<LayoutRevisionBeforeDeletePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a layout revision is deleted. */
export const LayoutRevisionAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutRevisionAfterDeletePayload>>
>("Wb/LayoutRevisionAfterDeleteEventHandler");

export namespace LayoutRevisionAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutRevisionAfterDeletePayload>>;
    export type Event = DomainEvent<LayoutRevisionAfterDeletePayload>;
    export type Layout = WbLayout;
}
