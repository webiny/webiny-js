import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutInUseError,
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IUnpublishLayoutParams {
    // A revision id, or an entry id: the published revision is unpublished.
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUnpublishLayoutRepository {
    execute(id: string): Promise<Result<WbLayout, RepositoryError>>;
}

export interface IUnpublishLayoutRepositoryErrors {
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = IUnpublishLayoutRepositoryErrors[keyof IUnpublishLayoutRepositoryErrors];

/** Unpublish a layout revision in storage. Replace it to keep layouts elsewhere. */
export const UnpublishLayoutRepository = createAbstraction<IUnpublishLayoutRepository>(
    "Wb/UnpublishLayoutRepository"
);

export namespace UnpublishLayoutRepository {
    export type Interface = IUnpublishLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUnpublishLayoutUseCase {
    execute(params: IUnpublishLayoutParams): Promise<Result<WbLayout, UseCaseError>>;
}

export interface IUnpublishLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    inUse: LayoutInUseError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IUnpublishLayoutUseCaseErrors[keyof IUnpublishLayoutUseCaseErrors];

/** Unpublish a layout. Fails with a `LayoutInUseError` while pages use it, or it is the default layout. */
export const UnpublishLayoutUseCase = createAbstraction<IUnpublishLayoutUseCase>(
    "Wb/UnpublishLayoutUseCase"
);

export namespace UnpublishLayoutUseCase {
    export type Interface = IUnpublishLayoutUseCase;
    export type Params = IUnpublishLayoutParams;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeUnpublishPayload {
    layout: WbLayout;
}

export interface LayoutAfterUnpublishPayload {
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before unpublished. */
export const LayoutBeforeUnpublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeUnpublishPayload>>
>("Wb/LayoutBeforeUnpublishEventHandler");

export namespace LayoutBeforeUnpublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeUnpublishPayload>>;
    export type Event = DomainEvent<LayoutBeforeUnpublishPayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after unpublished. */
export const LayoutAfterUnpublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterUnpublishPayload>>
>("Wb/LayoutAfterUnpublishEventHandler");

export namespace LayoutAfterUnpublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterUnpublishPayload>>;
    export type Event = DomainEvent<LayoutAfterUnpublishPayload>;
    export type Layout = WbLayout;
}
