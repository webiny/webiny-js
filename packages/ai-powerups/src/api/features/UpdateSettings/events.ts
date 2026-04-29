import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    AiPowerUpsSettingsBeforeUpdateEventHandler,
    AiPowerUpsSettingsAfterUpdateEventHandler
} from "./abstractions.js";
import type {
    AiPowerUpsSettingsBeforeUpdatePayload,
    AiPowerUpsSettingsAfterUpdatePayload
} from "./abstractions.js";

export class AiPowerUpsSettingsBeforeUpdateEvent extends DomainEvent<AiPowerUpsSettingsBeforeUpdatePayload> {
    eventType = "ai-PowerUps.settings.beforeUpdate" as const;

    getHandlerAbstraction() {
        return AiPowerUpsSettingsBeforeUpdateEventHandler;
    }
}

export class AiPowerUpsSettingsAfterUpdateEvent extends DomainEvent<AiPowerUpsSettingsAfterUpdatePayload> {
    eventType = "ai-PowerUps.settings.afterUpdate" as const;

    getHandlerAbstraction() {
        return AiPowerUpsSettingsAfterUpdateEventHandler;
    }
}
