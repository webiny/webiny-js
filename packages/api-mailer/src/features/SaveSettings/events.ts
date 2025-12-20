import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import { MailerSettingsBeforeSaveHandler, MailerSettingsAfterSaveHandler } from "./abstractions.js";
import type {
    MailerSettingsBeforeSavePayload,
    MailerSettingsAfterSavePayload
} from "./abstractions.js";

export class MailerSettingsBeforeSaveEvent extends DomainEvent<MailerSettingsBeforeSavePayload> {
    eventType = "mailer.settings.beforeSave" as const;

    getHandlerAbstraction() {
        return MailerSettingsBeforeSaveHandler;
    }
}

export class MailerSettingsAfterSaveEvent extends DomainEvent<MailerSettingsAfterSavePayload> {
    eventType = "mailer.settings.afterSave" as const;

    getHandlerAbstraction() {
        return MailerSettingsAfterSaveHandler;
    }
}
