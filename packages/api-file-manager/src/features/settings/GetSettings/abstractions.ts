import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileManagerSettings } from "~/domain/settings/types.js";

export interface IGetSettingsUseCaseErrors {}

type UseCaseError = IGetSettingsUseCaseErrors[keyof IGetSettingsUseCaseErrors];

/**
 * GetSettings use case - retrieves file manager settings.
 */
export interface IGetSettingsUseCase {
    execute(): Promise<Result<FileManagerSettings, UseCaseError>>;
}

/** Retrieve file manager settings. */
export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Error = UseCaseError;
}
