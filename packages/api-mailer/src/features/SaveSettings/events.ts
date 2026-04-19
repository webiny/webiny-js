import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    MailerSettingsBeforeSaveEventHandler,
    MailerSettingsAfterSaveEventHandler,
    type SaveSettingsInput,
    type MailerSettingsBeforeSavePayload,
    type MailerSettingsAfterSavePayload
} from "./abstractions.js";
import type { TransportSettings } from "~/types.js";

/**
 * Event classes strip the password from the payload inside their constructors.
 * This is a class invariant — subscribers (audit logs, telemetry, etc.) can
 * never see the plaintext or encrypted password, even if a future caller
 * forgets to strip it themselves.
 */

interface MailerSettingsBeforeSaveEventParams {
    input: SaveSettingsInput;
}

export class MailerSettingsBeforeSaveEvent extends DomainEvent<MailerSettingsBeforeSavePayload> {
    eventType = "mailer.settings.beforeSave" as const;

    constructor(params: MailerSettingsBeforeSaveEventParams) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...inputWithoutPassword } = params.input;
        super({ input: inputWithoutPassword });
    }

    getHandlerAbstraction() {
        return MailerSettingsBeforeSaveEventHandler;
    }
}

interface MailerSettingsAfterSaveEventParams {
    settings: TransportSettings;
}

export class MailerSettingsAfterSaveEvent extends DomainEvent<MailerSettingsAfterSavePayload> {
    eventType = "mailer.settings.afterSave" as const;

    constructor(params: MailerSettingsAfterSaveEventParams) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...settingsWithoutPassword } = params.settings;
        super({ settings: settingsWithoutPassword });
    }

    getHandlerAbstraction() {
        return MailerSettingsAfterSaveEventHandler;
    }
}
