import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ISettings } from "~/domain/settings/index.js";
import { SettingsRepository } from "../shared/abstractions.js";

export interface IGetSettingsErrors {
    // Add use-case-specific errors here if needed
}

type GetSettingsError = IGetSettingsErrors[keyof IGetSettingsErrors] | SettingsRepository.Error;

export interface IGetSettings {
    execute(name: string): Promise<Result<ISettings, GetSettingsError>>;
}

export const GetSettings = createAbstraction<IGetSettings>("GetSettings");

export namespace GetSettings {
    export type Interface = IGetSettings;
    export type Error = GetSettingsError;
}
