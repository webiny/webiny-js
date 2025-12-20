import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export interface IGetSettingsRepository {
    get(): Promise<Result<TransportSettings | null>>;
}

export const GetSettingsRepository =
    createAbstraction<IGetSettingsRepository>("GetSettingsRepository");

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettings {
    execute(): Promise<Result<TransportSettings | null>>;
}

export const GetSettings = createAbstraction<IGetSettings>("GetSettings");

export namespace GetSettings {
    export type Interface = IGetSettings;
}
