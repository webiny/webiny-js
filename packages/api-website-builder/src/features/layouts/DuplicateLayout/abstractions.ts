import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutSlugTakenError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IDuplicateLayoutParams {
    // The revision to copy; an entry id copies the latest revision.
    id: string;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IDuplicateLayoutUseCase {
    execute(params: IDuplicateLayoutParams): Promise<Result<WbLayout, UseCaseError>>;
}

export interface IDuplicateLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    validation: LayoutValidationError;
    slugTaken: LayoutSlugTakenError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IDuplicateLayoutUseCaseErrors[keyof IDuplicateLayoutUseCaseErrors];

/**
 * Duplicate a source layout into a new draft source layout titled "{title} (copy)", in the same language,
 * with the first free slug of "{slug}-copy", "{slug}-copy-2", ...
 */
export const DuplicateLayoutUseCase = createAbstraction<IDuplicateLayoutUseCase>(
    "Wb/DuplicateLayoutUseCase"
);

export namespace DuplicateLayoutUseCase {
    export type Interface = IDuplicateLayoutUseCase;
    export type Params = IDuplicateLayoutParams;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeDuplicatePayload {
    original: WbLayout;
}

export interface LayoutAfterDuplicatePayload {
    original: WbLayout;
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a layout is duplicated. */
export const LayoutBeforeDuplicateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeDuplicatePayload>>
>("Wb/LayoutBeforeDuplicateEventHandler");

export namespace LayoutBeforeDuplicateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeDuplicatePayload>>;
    export type Event = DomainEvent<LayoutBeforeDuplicatePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a layout is duplicated. */
export const LayoutAfterDuplicateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterDuplicatePayload>>
>("Wb/LayoutAfterDuplicateEventHandler");

export namespace LayoutAfterDuplicateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterDuplicatePayload>>;
    export type Event = DomainEvent<LayoutAfterDuplicatePayload>;
    export type Layout = WbLayout;
}
