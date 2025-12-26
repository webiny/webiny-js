import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ISettings } from "~/domain/settings/index.js";
import { SettingsRepository } from "../shared/abstractions.js";

export interface IGetSettingsUseCaseErrors {
    // Add use-case-specific errors here if needed
}

type UseCaseError =
    | IGetSettingsUseCaseErrors[keyof IGetSettingsUseCaseErrors]
    | SettingsRepository.Error;

export interface IGetSettingsUseCase {
    execute(name: string): Promise<Result<ISettings, UseCaseError>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Error = UseCaseError;
}
