import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ICreateLayoutRevisionFromParams {
    // The revision to copy; an entry id copies the latest revision.
    id: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreateLayoutRevisionFromRepository {
    execute(id: string): Promise<Result<WbLayout, RepositoryError>>;
}

export interface ICreateLayoutRevisionFromRepositoryErrors {
    notFound: LayoutNotFoundError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type RepositoryError =
    ICreateLayoutRevisionFromRepositoryErrors[keyof ICreateLayoutRevisionFromRepositoryErrors];

/** Create a new layout revision from an existing one in storage. Replace it to keep layouts elsewhere. */
export const CreateLayoutRevisionFromRepository =
    createAbstraction<ICreateLayoutRevisionFromRepository>("Wb/CreateLayoutRevisionFromRepository");

export namespace CreateLayoutRevisionFromRepository {
    export type Interface = ICreateLayoutRevisionFromRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreateLayoutRevisionFromUseCase {
    execute(params: ICreateLayoutRevisionFromParams): Promise<Result<WbLayout, UseCaseError>>;
}

export interface ICreateLayoutRevisionFromUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type UseCaseError =
    ICreateLayoutRevisionFromUseCaseErrors[keyof ICreateLayoutRevisionFromUseCaseErrors];

/** Create a new draft revision of a layout from an existing revision. */
export const CreateLayoutRevisionFromUseCase = createAbstraction<ICreateLayoutRevisionFromUseCase>(
    "Wb/CreateLayoutRevisionFromUseCase"
);

export namespace CreateLayoutRevisionFromUseCase {
    export type Interface = ICreateLayoutRevisionFromUseCase;
    export type Params = ICreateLayoutRevisionFromParams;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeCreateRevisionFromPayload {
    original: WbLayout;
}

export interface LayoutAfterCreateRevisionFromPayload {
    original: WbLayout;
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a revision is created from an existing one. */
export const LayoutBeforeCreateRevisionFromEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeCreateRevisionFromPayload>>
>("Wb/LayoutBeforeCreateRevisionFromEventHandler");

export namespace LayoutBeforeCreateRevisionFromEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeCreateRevisionFromPayload>>;
    export type Event = DomainEvent<LayoutBeforeCreateRevisionFromPayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a revision is created from an existing one. */
export const LayoutAfterCreateRevisionFromEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterCreateRevisionFromPayload>>
>("Wb/LayoutAfterCreateRevisionFromEventHandler");

export namespace LayoutAfterCreateRevisionFromEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterCreateRevisionFromPayload>>;
    export type Event = DomainEvent<LayoutAfterCreateRevisionFromPayload>;
    export type Layout = WbLayout;
}
