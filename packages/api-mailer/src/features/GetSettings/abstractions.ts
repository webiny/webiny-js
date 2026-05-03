import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export type MailerSettingsSource = "code" | "storage" | null;

export interface ISettingsWithSource {
    settings: TransportSettings | null;
    source: MailerSettingsSource;
}

export interface IGetSettingsRepository {
    get(transportName: string): Promise<Result<ISettingsWithSource>>;
}

export const GetSettingsRepository =
    createAbstraction<IGetSettingsRepository>("GetSettingsRepository");

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
    export type Return = Promise<Result<ISettingsWithSource>>;
}

export interface IGetSettingsUseCase {
    execute(transportName: string): Promise<Result<ISettingsWithSource>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
