import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { SettingsNotAuthorized, UnknownTransportSettings } from "~/domain/errors.js";
import type { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";

export type MailerSettingsSource = "code" | "storage" | null;

export interface ISettingsWithSource<
    TSettings extends object = TransportSettingsDefinition.Values
> {
    settings: TSettings | null;
    source: MailerSettingsSource;
}

/**
 * Reads a transport's settings with its secrets decrypted. For the transport itself (its
 * `MailTransportFactory`); no permission check.
 */
export interface IGetSettingsRepository {
    get<TSettings extends object = TransportSettingsDefinition.Values>(
        transport: string
    ): Promise<Result<ISettingsWithSource<TSettings>, UnknownTransportSettings>>;
}

export const GetSettingsRepository =
    createAbstraction<IGetSettingsRepository>("GetSettingsRepository");

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

/**
 * Reads a transport's settings for the GraphQL API: requires the `mailer.settings` permission and
 * leaves the secrets out.
 */
export interface IGetSettingsUseCase {
    execute(
        transport: string
    ): Promise<Result<ISettingsWithSource, SettingsNotAuthorized | UnknownTransportSettings>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
