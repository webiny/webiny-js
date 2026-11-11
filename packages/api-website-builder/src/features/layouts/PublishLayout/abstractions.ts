import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IPublishLayoutParams {
    // A revision id; an entry id publishes the latest revision.
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IPublishLayoutRepository {
    execute(id: string): Promise<Result<WbLayout, RepositoryError>>;
}

export interface IPublishLayoutRepositoryErrors {
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = IPublishLayoutRepositoryErrors[keyof IPublishLayoutRepositoryErrors];

/** Publish a layout revision in storage. Replace it to keep layouts elsewhere. */
export const PublishLayoutRepository = createAbstraction<IPublishLayoutRepository>(
    "Wb/PublishLayoutRepository"
);

export namespace PublishLayoutRepository {
    export type Interface = IPublishLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IPublishLayoutUseCase {
    execute(params: IPublishLayoutParams): Promise<Result<WbLayout, UseCaseError>>;
}

export interface IPublishLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IPublishLayoutUseCaseErrors[keyof IPublishLayoutUseCaseErrors];

/** Publish a layout revision. Pages are rendered in the published revision of their layout. */
export const PublishLayoutUseCase =
    createAbstraction<IPublishLayoutUseCase>("Wb/PublishLayoutUseCase");

export namespace PublishLayoutUseCase {
    export type Interface = IPublishLayoutUseCase;
    export type Params = IPublishLayoutParams;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforePublishPayload {
    layout: WbLayout;
}

export interface LayoutAfterPublishPayload {
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before published. */
export const LayoutBeforePublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforePublishPayload>>
>("Wb/LayoutBeforePublishEventHandler");

export namespace LayoutBeforePublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforePublishPayload>>;
    export type Event = DomainEvent<LayoutBeforePublishPayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after published. */
export const LayoutAfterPublishEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterPublishPayload>>
>("Wb/LayoutAfterPublishEventHandler");

export namespace LayoutAfterPublishEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterPublishPayload>>;
    export type Event = DomainEvent<LayoutAfterPublishPayload>;
    export type Layout = WbLayout;
}
