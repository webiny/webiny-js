import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import type { LayoutSettings } from "~/domain/layout/layoutSettings.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ISetDefaultLayoutRepository {
    execute(settings: LayoutSettings): Promise<Result<LayoutSettings, RepositoryError>>;
}

export interface ISetDefaultLayoutRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError = ISetDefaultLayoutRepositoryErrors[keyof ISetDefaultLayoutRepositoryErrors];

/** Write the tenant's layout settings to storage. Replace it to keep them elsewhere. */
export const SetDefaultLayoutRepository = createAbstraction<ISetDefaultLayoutRepository>(
    "Wb/SetDefaultLayoutRepository"
);

export namespace SetDefaultLayoutRepository {
    export type Interface = ISetDefaultLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<LayoutSettings, RepositoryError>>;
    export type Settings = LayoutSettings;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface ISetDefaultLayoutUseCase {
    // The entry id of a published source layout; `null` clears the default.
    execute(id: string | null): Promise<Result<LayoutSettings, UseCaseError>>;
}

export interface ISetDefaultLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    validation: LayoutValidationError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = ISetDefaultLayoutUseCaseErrors[keyof ISetDefaultLayoutUseCaseErrors];

/**
 * Set the layout new pages get when they're created without one: a published source layout.
 * `null` clears it.
 */
export const SetDefaultLayoutUseCase = createAbstraction<ISetDefaultLayoutUseCase>(
    "Wb/SetDefaultLayoutUseCase"
);

export namespace SetDefaultLayoutUseCase {
    export type Interface = ISetDefaultLayoutUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<LayoutSettings, UseCaseError>>;
    export type Settings = LayoutSettings;
}
