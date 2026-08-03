import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    ThemeAfterCreateRevisionFromEventHandler,
    type ThemeAfterCreateRevisionFromPayload
} from "./abstractions.js";

export class ThemeAfterCreateRevisionFromEvent extends DomainEvent<ThemeAfterCreateRevisionFromPayload> {
    eventType = "theme.afterCreateRevisionFrom" as const;

    getHandlerAbstraction() {
        return ThemeAfterCreateRevisionFromEventHandler;
    }
}
