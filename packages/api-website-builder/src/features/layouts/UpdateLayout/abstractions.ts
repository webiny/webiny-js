import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutLockedError,
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutSlugTakenError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { CmsEntryWbLayout, Layout as WbLayout } from "~/domain/layout/abstractions.js";

export interface UpdateLayoutData {
    // Merged into the stored properties. A language version keeps its `language` and `sourceLayout`, and has
    // no `slug`. A changed `slug` must be free.
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    elements?: Record<string, any>;
    bindings?: Record<string, any>;
    extensions?: Record<string, any>;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IUpdateLayoutRepository {
    // Replace the values of a layout revision.
    execute(id: string, data: CmsEntryWbLayout): Promise<Result<WbLayout, RepositoryError>>;
}

export interface IUpdateLayoutRepositoryErrors {
    notFound: LayoutNotFoundError;
    locked: LayoutLockedError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = IUpdateLayoutRepositoryErrors[keyof IUpdateLayoutRepositoryErrors];

/** Write changes to a layout revision to storage. Replace it to keep layouts elsewhere. */
export const UpdateLayoutRepository = createAbstraction<IUpdateLayoutRepository>(
    "Wb/UpdateLayoutRepository"
);

export namespace UpdateLayoutRepository {
    export type Interface = IUpdateLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
    export type Data = CmsEntryWbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IUpdateLayoutUseCase {
    // `id` is a revision id; an entry id updates the latest revision.
    execute(id: string, data: UpdateLayoutData): Promise<Result<WbLayout, UseCaseError>>;
}

export interface IUpdateLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    locked: LayoutLockedError;
    validation: LayoutValidationError;
    slugTaken: LayoutSlugTakenError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IUpdateLayoutUseCaseErrors[keyof IUpdateLayoutUseCaseErrors];

/**
 * Update a layout revision. A published (locked) revision can't be changed: create a new revision from it.
 * Global component instance elements are never stored with a layout; bindings are stored as sent.
 */
export const UpdateLayoutUseCase =
    createAbstraction<IUpdateLayoutUseCase>("Wb/UpdateLayoutUseCase");

export namespace UpdateLayoutUseCase {
    export type Interface = IUpdateLayoutUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Data = UpdateLayoutData;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeUpdatePayload {
    original: WbLayout;
    input: {
        id: string;
        data: UpdateLayoutData;
    };
}

export interface LayoutAfterUpdatePayload {
    original: WbLayout;
    input: {
        id: string;
        data: UpdateLayoutData;
    };
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a layout is updated. */
export const LayoutBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeUpdatePayload>>
>("Wb/LayoutBeforeUpdateEventHandler");

export namespace LayoutBeforeUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeUpdatePayload>>;
    export type Event = DomainEvent<LayoutBeforeUpdatePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a layout is updated. */
export const LayoutAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterUpdatePayload>>
>("Wb/LayoutAfterUpdateEventHandler");

export namespace LayoutAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterUpdatePayload>>;
    export type Event = DomainEvent<LayoutAfterUpdatePayload>;
    export type Layout = WbLayout;
}
