import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSettings } from "~/types.js";

export interface SaveSettingsInput {
    host: string;
    port?: number;
    user: string;
    password?: string;
    from: string;
    replyTo?: string;
}

export interface ISaveSettingsRepository {
    save(input: SaveSettingsInput): Promise<Result<TransportSettings, never>>;
}

export const SaveSettingsRepository =
    createAbstraction<ISaveSettingsRepository>("SaveSettingsRepository");

export namespace SaveSettingsRepository {
    export type Interface = ISaveSettingsRepository;
}

export interface ISaveSettings {
    execute(input: SaveSettingsInput): Promise<Result<TransportSettings, never>>;
}

export const SaveSettings = createAbstraction<ISaveSettings>("SaveSettings");

export namespace SaveSettings {
    export type Interface = ISaveSettings;
}

// Domain Events
export interface MailerSettingsBeforeSavePayload {
    input: SaveSettingsInput;
}

export class MailerSettingsBeforeSaveEvent extends DomainEvent<MailerSettingsBeforeSavePayload> {
    static eventName = "mailer.settings.beforeSave" as const;

}

export interface MailerSettingsAfterSavePayload {
    settings: TransportSettings;
}

export class MailerSettingsAfterSaveEvent extends DomainEvent<MailerSettingsAfterSavePayload> {
    static eventName = "mailer.settings.afterSave" as const;
}
