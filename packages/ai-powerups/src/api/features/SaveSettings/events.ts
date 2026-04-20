import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    AiPowerupsSettingsBeforeSaveEventHandler,
    AiPowerupsSettingsAfterSaveEventHandler
} from "./abstractions.js";
import type {
    AiPowerupsSettingsBeforeSavePayload,
    AiPowerupsSettingsAfterSavePayload
} from "./abstractions.js";

export class AiPowerupsSettingsBeforeSaveEvent extends DomainEvent<AiPowerupsSettingsBeforeSavePayload> {
    eventType = "ai-powerups.settings.beforeSave" as const;

    getHandlerAbstraction() {
        return AiPowerupsSettingsBeforeSaveEventHandler;
    }
}

export class AiPowerupsSettingsAfterSaveEvent extends DomainEvent<AiPowerupsSettingsAfterSavePayload> {
    eventType = "ai-powerups.settings.afterSave" as const;

    getHandlerAbstraction() {
        return AiPowerupsSettingsAfterSaveEventHandler;
    }
}
