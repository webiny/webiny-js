import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterDeleteEventHandler,
    ThemeBeforeDeleteEventHandler,
    type ThemeAfterDeletePayload,
    type ThemeBeforeDeletePayload
} from "./abstractions.js";

export class ThemeBeforeDeleteEvent extends DomainEvent<ThemeBeforeDeletePayload> {
    eventType = "theme.beforeDelete" as const;

    getHandlerAbstraction() {
        return ThemeBeforeDeleteEventHandler;
    }
}

export class ThemeAfterDeleteEvent extends DomainEvent<ThemeAfterDeletePayload> {
    eventType = "theme.afterDelete" as const;

    getHandlerAbstraction() {
        return ThemeAfterDeleteEventHandler;
    }
}
