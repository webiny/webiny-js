import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    GlobalComponentAfterSaveEventHandler,
    GlobalComponentBeforeSaveEventHandler
} from "./abstractions.js";
import type {
    GlobalComponentAfterSavePayload,
    GlobalComponentBeforeSavePayload
} from "./abstractions.js";

// GlobalComponentBeforeSave Event
export class GlobalComponentBeforeSaveEvent extends DomainEvent<GlobalComponentBeforeSavePayload> {
    eventType = "globalComponent.beforeSave" as const;

    getHandlerAbstraction() {
        return GlobalComponentBeforeSaveEventHandler;
    }
}

// GlobalComponentAfterSave Event
export class GlobalComponentAfterSaveEvent extends DomainEvent<GlobalComponentAfterSavePayload> {
    eventType = "globalComponent.afterSave" as const;

    getHandlerAbstraction() {
        return GlobalComponentAfterSaveEventHandler;
    }
}
