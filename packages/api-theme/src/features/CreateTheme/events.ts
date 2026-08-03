import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterCreateEventHandler,
    ThemeBeforeCreateEventHandler,
    type ThemeAfterCreatePayload,
    type ThemeBeforeCreatePayload
} from "./abstractions.js";

export class ThemeBeforeCreateEvent extends DomainEvent<ThemeBeforeCreatePayload> {
    eventType = "theme.beforeCreate" as const;

    getHandlerAbstraction() {
        return ThemeBeforeCreateEventHandler;
    }
}

export class ThemeAfterCreateEvent extends DomainEvent<ThemeAfterCreatePayload> {
    eventType = "theme.afterCreate" as const;

    getHandlerAbstraction() {
        return ThemeAfterCreateEventHandler;
    }
}
