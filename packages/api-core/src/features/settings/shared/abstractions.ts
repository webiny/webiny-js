import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    SettingsStorageRecord,
    IGetSettingsStorageParams,
    IUpdateSettingsStorageParams,
    IDeleteSettingsStorageParams
} from "./types.js";
import { SettingsNotFoundError, SettingsStorageError } from "./errors.js";
import type { ISettings } from "~/domain/settings/index.js";

// Storage Operations Abstraction (tenant-aware)
export interface ISettingsStorageOperations {
    getSettings(params: IGetSettingsStorageParams): Promise<SettingsStorageRecord | null>;
    updateSettings(params: IUpdateSettingsStorageParams): Promise<void>;
    deleteSettings(params: IDeleteSettingsStorageParams): Promise<void>;
}

export const SettingsStorageOperations = createAbstraction<ISettingsStorageOperations>(
    "SettingsStorageOperations"
);

export namespace SettingsStorageOperations {
    export type Interface = ISettingsStorageOperations;
    export type GetSettingsParams = IGetSettingsStorageParams;
    export type UpdateSettingsParams = IUpdateSettingsStorageParams;
    export type DeleteSettingsParams = IDeleteSettingsStorageParams;
}

// Repository Abstraction
export interface ISettingsRepositoryErrors {
    base: SettingsNotFoundError | SettingsStorageError;
}

type RepositoryError = ISettingsRepositoryErrors[keyof ISettingsRepositoryErrors];

export interface ISettingsRepository {
    get(name: string): Promise<Result<ISettings, RepositoryError>>;
    update(settings: ISettings): Promise<Result<void, RepositoryError>>;
    delete(name: string): Promise<Result<void, RepositoryError>>;
}

export const SettingsRepository = createAbstraction<ISettingsRepository>("SettingsRepository");

export namespace SettingsRepository {
    export type Interface = ISettingsRepository;
    export type Error = RepositoryError;
}
