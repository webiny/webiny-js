import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ISettings } from "~/domain/settings/index.js";
import { SettingsRepository } from "../shared/abstractions.js";

export interface IDeleteSettingsErrors {
    // Add use-case-specific errors here if needed
}

type DeleteSettingsError =
    | IDeleteSettingsErrors[keyof IDeleteSettingsErrors]
    | SettingsRepository.Error;

export interface IDeleteSettingsUseCase {
    execute(name: string): Promise<Result<void, DeleteSettingsError>>;
}

export const DeleteSettingsUseCase =
    createAbstraction<IDeleteSettingsUseCase>("DeleteSettingsUseCase");

export namespace DeleteSettingsUseCase {
    export type Interface = IDeleteSettingsUseCase;
    export type Error = DeleteSettingsError;
}

export interface SettingsBeforeDeletePayload {
    settings: ISettings;
}

export interface SettingsAfterDeletePayload {
    settings: ISettings;
}
