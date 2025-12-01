import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import type { UpdateSettingsInput } from "~/domain/settings/types.js";
import type { SettingsUpdateError } from "~/domain/settings/errors.js";
import type { SettingsValidationError } from "~/domain/settings/errors.js";

/**
 * UpdateSettings use case interface
 */
export interface IUpdateSettingsUseCase {
    execute(input: UpdateSettingsInput): Promise<Result<FileManagerSettings, UseCaseError>>;
}

export interface IUpdateSettingsUseCaseErrors {
    updateError: SettingsUpdateError;
    validationError: SettingsValidationError;
}

type UseCaseError = IUpdateSettingsUseCaseErrors[keyof IUpdateSettingsUseCaseErrors];

export const UpdateSettingsUseCase =
    createAbstraction<IUpdateSettingsUseCase>("UpdateSettingsUseCase");

export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
    export type Error = UseCaseError;
}
