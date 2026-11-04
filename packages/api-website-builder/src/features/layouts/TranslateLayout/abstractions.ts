import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutTranslationError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ITranslateLayoutParams {
    // The source layout; a revision id copies that revision, an entry id the latest one.
    id: string;
    // The language of the new version.
    language: string;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ITranslateLayoutUseCase {
    execute(params: ITranslateLayoutParams): Promise<Result<WbLayout, UseCaseError>>;
}

export interface ITranslateLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    translation: LayoutTranslationError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = ITranslateLayoutUseCaseErrors[keyof ITranslateLayoutUseCaseErrors];

/** Create the version of a source layout in a language, as a draft copy of the source's elements and bindings. There is one version per source and language. */
export const TranslateLayoutUseCase = createAbstraction<ITranslateLayoutUseCase>(
    "Wb/TranslateLayoutUseCase"
);

export namespace TranslateLayoutUseCase {
    export type Interface = ITranslateLayoutUseCase;
    export type Params = ITranslateLayoutParams;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Error = UseCaseError;
    export type Layout = WbLayout;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface LayoutBeforeTranslatePayload {
    original: WbLayout;
    language: string;
}

export interface LayoutAfterTranslatePayload {
    original: WbLayout;
    language: string;
    layout: WbLayout;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into layout lifecycle before a language version of a source layout is created. */
export const LayoutBeforeTranslateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutBeforeTranslatePayload>>
>("Wb/LayoutBeforeTranslateEventHandler");

export namespace LayoutBeforeTranslateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutBeforeTranslatePayload>>;
    export type Event = DomainEvent<LayoutBeforeTranslatePayload>;
    export type Layout = WbLayout;
}

/** Hook into layout lifecycle after a language version of a source layout is created. */
export const LayoutAfterTranslateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<LayoutAfterTranslatePayload>>
>("Wb/LayoutAfterTranslateEventHandler");

export namespace LayoutAfterTranslateEventHandler {
    export type Interface = IEventHandler<DomainEvent<LayoutAfterTranslatePayload>>;
    export type Event = DomainEvent<LayoutAfterTranslatePayload>;
    export type Layout = WbLayout;
}
