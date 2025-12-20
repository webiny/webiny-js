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

export interface IGetSettingsUSeCase {
    execute(): Promise<Result<TransportSettings | null>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUSeCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUSeCase;
}
