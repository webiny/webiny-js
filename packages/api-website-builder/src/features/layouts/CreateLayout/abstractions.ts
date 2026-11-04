import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutNotAuthorizedError,
    LayoutPersistenceError,
    LayoutSlugTakenError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { CmsEntryWbLayout, Layout as WbLayout } from "~/domain/layout/abstractions.js";

export interface CreateLayoutData {
    // `title` is required; `language` is optional. `sourceLayout` is ignored: only translating sets it.
    // `slug` must be free; left out, the first free slug made from the title is used.
    properties: { title: string; slug?: string; language?: string; [key: string]: any };
    // Leave both out to start with the root and the page content placeholder.
    elements?: Record<string, any>;
    bindings?: Record<string, any>;
    metadata?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface CreateLayoutRepositoryOptions {
    // The entry id of the new layout; generated when left out.
    id?: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICreateLayoutRepository {
    execute(
        data: CmsEntryWbLayout,
        options?: CreateLayoutRepositoryOptions
    ): Promise<Result<WbLayout, RepositoryError>>;
}

export interface ICreateLayoutRepositoryErrors {
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = ICreateLayoutRepositoryErrors[keyof ICreateLayoutRepositoryErrors];

/** Write a new layout (its first revision, a draft) to storage. Replace it to keep layouts elsewhere. */
export const CreateLayoutRepository = createAbstraction<ICreateLayoutRepository>(
    "Wb/CreateLayoutRepository"
);

export namespace CreateLayoutRepository {
    export type Interface = ICreateLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
    export type Data = CmsEntryWbLayout;
    export type Options = CreateLayoutRepositoryOptions;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ICreateLayoutUseCase {
    execute(data: CreateLayoutData): Promise<Result<WbLayout, UseCaseError>>;
}

export interface ICreateLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    validation: LayoutValidationError;
    slugTaken: LayoutSlugTakenError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = ICreateLayoutUseCaseErrors[keyof ICreateLayoutUseCaseErrors];

/** Create a source layout as a draft. Without elements, it starts with the page content placeholder in it. */
export const CreateLayoutUseCase =
    createAbstraction<ICreateLayoutUseCase>("Wb/CreateLayoutUseCase");

export namespace CreateLayoutUseCase {
    export type Interface = ICreateLayoutUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Data = CreateLayoutData;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeCreatePayload {
    input: CmsEntryWbLayout;
}

export interface LayoutAfterCreatePayload {
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a layout is created. */
export const LayoutBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeCreatePayload>>
>("Wb/LayoutBeforeCreateEventHandler");

export namespace LayoutBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeCreatePayload>>;
    export type Event = DomainEvent<LayoutBeforeCreatePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a layout is created. */
export const LayoutAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterCreatePayload>>
>("Wb/LayoutAfterCreateEventHandler");

export namespace LayoutAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterCreatePayload>>;
    export type Event = DomainEvent<LayoutAfterCreatePayload>;
    export type Layout = WbLayout;
}
