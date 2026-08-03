import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterActivateEventHandler,
    ThemeAfterDeactivateEventHandler,
    ThemeBeforeActivateEventHandler,
    type ThemeAfterActivatePayload,
    type ThemeAfterDeactivatePayload,
    type ThemeBeforeActivatePayload
} from "./abstractions.js";

export class ThemeBeforeActivateEvent extends DomainEvent<ThemeBeforeActivatePayload> {
    eventType = "theme.beforeActivate" as const;

    getHandlerAbstraction() {
        return ThemeBeforeActivateEventHandler;
    }
}

export class ThemeAfterActivateEvent extends DomainEvent<ThemeAfterActivatePayload> {
    eventType = "theme.afterActivate" as const;

    getHandlerAbstraction() {
        return ThemeAfterActivateEventHandler;
    }
}

export class ThemeAfterDeactivateEvent extends DomainEvent<ThemeAfterDeactivatePayload> {
    eventType = "theme.afterDeactivate" as const;

    getHandlerAbstraction() {
        return ThemeAfterDeactivateEventHandler;
    }
}
