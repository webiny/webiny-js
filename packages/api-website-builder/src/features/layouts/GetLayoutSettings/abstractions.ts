import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutNotAuthorizedError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { LayoutSettings } from "~/domain/layout/layoutSettings.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetLayoutSettingsRepository {
    execute(): Promise<Result<LayoutSettings, RepositoryError>>;
}

export interface IGetLayoutSettingsRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError = IGetLayoutSettingsRepositoryErrors[keyof IGetLayoutSettingsRepositoryErrors];

/** Read the tenant's layout settings from storage. Replace it to keep them elsewhere. */
export const GetLayoutSettingsRepository = createAbstraction<IGetLayoutSettingsRepository>(
    "Wb/GetLayoutSettingsRepository"
);

export namespace GetLayoutSettingsRepository {
    export type Interface = IGetLayoutSettingsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<LayoutSettings, RepositoryError>>;
    export type Settings = LayoutSettings;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLayoutSettingsUseCase {
    execute(): Promise<Result<LayoutSettings, UseCaseError>>;
}

export interface IGetLayoutSettingsUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetLayoutSettingsUseCaseErrors[keyof IGetLayoutSettingsUseCaseErrors];

/** Retrieve the tenant's layout settings: its default layout. */
export const GetLayoutSettingsUseCase = createAbstraction<IGetLayoutSettingsUseCase>(
    "Wb/GetLayoutSettingsUseCase"
);

export namespace GetLayoutSettingsUseCase {
    export type Interface = IGetLayoutSettingsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<LayoutSettings, UseCaseError>>;
    export type Settings = LayoutSettings;
}
