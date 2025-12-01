import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ISettings } from "~/domain/settings/index.js";
import type { IUpdateSettingsInput } from "../shared/types.js";
import { SettingsRepository } from "../shared/abstractions.js";
import { SettingsValidationError } from "../shared/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IUpdateSettingsErrors {
    validation: SettingsValidationError;
}

type UpdateSettingsError =
    | IUpdateSettingsErrors[keyof IUpdateSettingsErrors]
    | SettingsRepository.Error;

export interface IUpdateSettingsUseCase {
    execute(input: IUpdateSettingsInput): Promise<Result<ISettings, UpdateSettingsError>>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>("UpdateSettingsUseCase");

export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
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
