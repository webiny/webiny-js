import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";
import type {
    GlobalComponentPersistenceError,
    GlobalComponentValidationError
} from "~/domain/globals/errors.js";
import type { GlobalComponent as WbGlobalComponent } from "~/domain/globals/abstractions.js";

export interface SaveGlobalComponentInput {
    name: string;
    // A language code; `"default"` (or nothing) for pages without a language.
    language?: string | null;
    elements: Record<string, any>;
    bindings: Record<string, any>;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ISaveGlobalComponentRepository {
    // Create or replace the stored instance of one global component in its language.
    execute(
        globalComponent: WbGlobalComponent
    ): Promise<Result<WbGlobalComponent, RepositoryError>>;
}

export interface ISaveGlobalComponentRepositoryErrors {
    validation: GlobalComponentValidationError;
    persistence: GlobalComponentPersistenceError;
}

type RepositoryError =
    ISaveGlobalComponentRepositoryErrors[keyof ISaveGlobalComponentRepositoryErrors];

/** Write one global component to storage. Replace it to keep global components elsewhere. */
export const SaveGlobalComponentRepository = createAbstraction<ISaveGlobalComponentRepository>(
    "Wb/SaveGlobalComponentRepository"
);

export namespace SaveGlobalComponentRepository {
    export type Interface = ISaveGlobalComponentRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbGlobalComponent, RepositoryError>>;
    export type GlobalComponent = WbGlobalComponent;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ISaveGlobalComponentUseCase {
    execute(
        globalComponent: SaveGlobalComponentInput
    ): Promise<Result<WbGlobalComponent, UseCaseError>>;
}

export interface ISaveGlobalComponentUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    validation: GlobalComponentValidationError;
    persistence: GlobalComponentPersistenceError;
}

type UseCaseError = ISaveGlobalComponentUseCaseErrors[keyof ISaveGlobalComponentUseCaseErrors];

/**
 * Replace the stored instance of one global component in one language.
 * Other global components, and the same global in other languages, are not touched.
 */
export const SaveGlobalComponentUseCase = createAbstraction<ISaveGlobalComponentUseCase>(
    "Wb/SaveGlobalComponentUseCase"
);

export namespace SaveGlobalComponentUseCase {
    export type Interface = ISaveGlobalComponentUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbGlobalComponent, UseCaseError>>;
    export type Input = SaveGlobalComponentInput;
    export type GlobalComponent = WbGlobalComponent;
}

// ============================================================================
// Event Payload Types
// ============================================================================

export interface GlobalComponentBeforeSavePayload {
    // The global component about to be saved, with its language resolved.
    input: WbGlobalComponent;
}

export interface GlobalComponentAfterSavePayload {
    globalComponent: WbGlobalComponent;
}

// ============================================================================
// Event Handler Abstractions
// ============================================================================

/** Hook into global components before one is saved. */
export const GlobalComponentBeforeSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<GlobalComponentBeforeSavePayload>>
>("Wb/GlobalComponentBeforeSaveEventHandler");

export namespace GlobalComponentBeforeSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<GlobalComponentBeforeSavePayload>>;
    export type Event = DomainEvent<GlobalComponentBeforeSavePayload>;
    export type GlobalComponent = WbGlobalComponent;
}

/** Hook into global components after one is saved. */
export const GlobalComponentAfterSaveEventHandler = createAbstraction<
    IEventHandler<DomainEvent<GlobalComponentAfterSavePayload>>
>("Wb/GlobalComponentAfterSaveEventHandler");

export namespace GlobalComponentAfterSaveEventHandler {
    export type Interface = IEventHandler<DomainEvent<GlobalComponentAfterSavePayload>>;
    export type Event = DomainEvent<GlobalComponentAfterSavePayload>;
    export type GlobalComponent = WbGlobalComponent;
}
