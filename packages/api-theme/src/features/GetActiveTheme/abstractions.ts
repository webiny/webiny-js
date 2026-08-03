import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ActiveThemePointer, Theme } from "~/domain/theme/abstractions.js";
import { ThemeNotAuthorizedError, ThemePersistenceError } from "~/domain/theme/errors.js";

export interface IGetActiveThemeResult {
    /** `null` when the tenant has no active theme — a supported, permanent state. */
    theme: Theme | null;
    pointer: ActiveThemePointer | null;
}

export interface IGetActiveThemeUseCase {
    execute(): Promise<Result<IGetActiveThemeResult, UseCaseError>>;
}

export interface IGetActiveThemeUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IGetActiveThemeUseCaseErrors[keyof IGetActiveThemeUseCaseErrors];

/**
 * Resolve the tenant's active theme. Returns `{ theme: null, pointer: null }` rather than failing
 * when nothing is active, and also when the pointer refers to a version that has since been
 * deleted — a dangling pointer must degrade to "no theme", never to a broken site.
 */
export const GetActiveThemeUseCase = createAbstraction<IGetActiveThemeUseCase>(
    "Theme/GetActiveThemeUseCase"
);

export namespace GetActiveThemeUseCase {
    export type Interface = IGetActiveThemeUseCase;
    export type Output = IGetActiveThemeResult;
    export type Return = Promise<Result<IGetActiveThemeResult, UseCaseError>>;
    export type Error = UseCaseError;
}
