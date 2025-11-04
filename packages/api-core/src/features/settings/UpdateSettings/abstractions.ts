import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ISettings } from "~/domain/settings/index.js";
import type { UpdateSettingsInput } from "../shared/types.js";
import { SettingsRepository } from "../shared/abstractions.js";
import { SettingsValidationError } from "../shared/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IUpdateSettingsErrors {
    validation: SettingsValidationError;
}

type UpdateSettingsError =
    | IUpdateSettingsErrors[keyof IUpdateSettingsErrors]
    | SettingsRepository.Error;

export interface IUpdateSettings {
    execute(input: UpdateSettingsInput): Promise<Result<ISettings, UpdateSettingsError>>;
}

export const UpdateSettings = createAbstraction<IUpdateSettings>("UpdateSettings");

export namespace UpdateSettings {
    export type Interface = IUpdateSettings;
    export type Error = UpdateSettingsError;
}

export interface SettingsBeforeUpdatePayload {
    settings: ISettings;
    input: GenericRecord<string>;
}

export interface SettingsAfterUpdatePayload {
    settings: ISettings;
    input: GenericRecord<string>;
}
