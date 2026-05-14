import { createAbstraction } from "@webiny/feature/admin";
import type { FmSettings } from "../shared/types.js";

// Gateway — performs the GraphQL call to retrieve settings.
export interface IGetSettingsGateway {
    execute(): Promise<FmSettings>;
}

export const GetSettingsGateway = createAbstraction<IGetSettingsGateway>("GetSettingsGateway");

export namespace GetSettingsGateway {
    export type Interface = IGetSettingsGateway;
}

// Gateway — performs the GraphQL mutation to save settings.
export interface ISaveSettingsGateway {
    execute(data: FmSettings): Promise<FmSettings>;
}

export const SaveSettingsGateway = createAbstraction<ISaveSettingsGateway>("SaveSettingsGateway");

export namespace SaveSettingsGateway {
    export type Interface = ISaveSettingsGateway;
}

// Repository — caches settings as MobX observable state.
export interface IGetSettingsRepository {
    execute(): Promise<FmSettings>;
    save(data: FmSettings): Promise<FmSettings>;
    readonly settings: FmSettings | null;
}

export const GetSettingsRepository =
    createAbstraction<IGetSettingsRepository>("GetSettingsRepository");

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

// UseCase — orchestrates a single get-settings operation.
export interface IGetSettingsUseCase {
    execute(): Promise<FmSettings>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
