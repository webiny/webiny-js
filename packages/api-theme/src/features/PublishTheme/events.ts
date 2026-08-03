import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterPublishEventHandler,
    ThemeBeforePublishEventHandler,
    type ThemeAfterPublishPayload,
    type ThemeBeforePublishPayload
} from "./abstractions.js";

export class ThemeBeforePublishEvent extends DomainEvent<ThemeBeforePublishPayload> {
    eventType = "theme.beforePublish" as const;

    getHandlerAbstraction() {
        return ThemeBeforePublishEventHandler;
    }
}

export class ThemeAfterPublishEvent extends DomainEvent<ThemeAfterPublishPayload> {
    eventType = "theme.afterPublish" as const;

    getHandlerAbstraction() {
        return ThemeAfterPublishEventHandler;
    }
}
