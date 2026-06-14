import { createAbstraction } from "@webiny/feature/admin";
import type { MailerSettings } from "~/types.js";

export interface IGetSettingsGateway {
    execute(): Promise<MailerSettings>;
}

export const GetSettingsGateway = createAbstraction<IGetSettingsGateway>(
    "Mailer/GetSettingsGateway"
);

export namespace GetSettingsGateway {
    export type Interface = IGetSettingsGateway;
}

export interface IGetSettingsRepository {
    execute(): Promise<MailerSettings>;
    updateSettings(settings: MailerSettings): void;
    readonly settings: MailerSettings | null;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "Mailer/GetSettingsRepository"
);

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
}

export interface IGetSettingsUseCase {
    execute(): Promise<MailerSettings>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "Mailer/GetSettingsUseCase"
);

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
}
