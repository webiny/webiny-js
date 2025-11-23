import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import { SettingsNotFoundError } from "~/domain/settings/errors.js";

export interface IGetSettingsUseCaseErrors {
    notFound: SettingsNotFoundError;
}

type UseCaseError = IGetSettingsUseCaseErrors[keyof IGetSettingsUseCaseErrors];

/**
 * GetSettings use case - retrieves file manager settings.
 */
export interface IGetSettingsUseCase {
    execute(): Promise<Result<FileManagerSettings, UseCaseError>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Error = UseCaseError;
}
