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

export interface IDeleteLayoutParams {
    // The entry id (a revision id is taken as its entry id).
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IDeleteLayoutRepository {
    execute(entryId: string): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteLayoutRepositoryErrors {
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = IDeleteLayoutRepositoryErrors[keyof IDeleteLayoutRepositoryErrors];

/** Delete a layout with all its revisions from storage. Replace it to keep layouts elsewhere. */
export const DeleteLayoutRepository = createAbstraction<IDeleteLayoutRepository>(
    "Wb/DeleteLayoutRepository"
);

export namespace DeleteLayoutRepository {
    export type Interface = IDeleteLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<void, RepositoryError>>;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDeleteLayoutUseCase {
    execute(params: IDeleteLayoutParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    inUse: LayoutInUseError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IDeleteLayoutUseCaseErrors[keyof IDeleteLayoutUseCaseErrors];

/** Delete a layout with all its revisions; deleting a source layout also deletes its language versions. Fails with a `LayoutInUseError` while the layout is in use. */
export const DeleteLayoutUseCase =
    createAbstraction<IDeleteLayoutUseCase>("Wb/DeleteLayoutUseCase");

export namespace DeleteLayoutUseCase {
    export type Interface = IDeleteLayoutUseCase;
    export type Params = IDeleteLayoutParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeDeletePayload {
    layout: WbLayout;
}

export interface LayoutAfterDeletePayload {
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a layout is deleted (once per deleted layout: a source, and each of its language versions). */
export const LayoutBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeDeletePayload>>
>("Wb/LayoutBeforeDeleteEventHandler");

export namespace LayoutBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeDeletePayload>>;
    export type Event = DomainEvent<LayoutBeforeDeletePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a layout is deleted (once per deleted layout: a source, and each of its language versions). */
export const LayoutAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterDeletePayload>>
>("Wb/LayoutAfterDeleteEventHandler");

export namespace LayoutAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterDeletePayload>>;
    export type Event = DomainEvent<LayoutAfterDeletePayload>;
    export type Layout = WbLayout;
}
