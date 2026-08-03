import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterUpdateEventHandler,
    ThemeBeforeUpdateEventHandler,
    type ThemeAfterUpdatePayload,
    type ThemeBeforeUpdatePayload
} from "./abstractions.js";

export class ThemeBeforeUpdateEvent extends DomainEvent<ThemeBeforeUpdatePayload> {
    eventType = "theme.beforeUpdate" as const;

    getHandlerAbstraction() {
        return ThemeBeforeUpdateEventHandler;
    }
}

export class ThemeAfterUpdateEvent extends DomainEvent<ThemeAfterUpdatePayload> {
    eventType = "theme.afterUpdate" as const;

    getHandlerAbstraction() {
        return ThemeAfterUpdateEventHandler;
    }
}
