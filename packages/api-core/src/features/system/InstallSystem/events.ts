import { DomainEvent } from "~/features/eventPublisher/index.js";
import { SystemInstalledEventHandler } from "./abstractions.js";

export class SystemInstalledEvent extends DomainEvent {
    eventType = "system.installed" as const;

    getHandlerAbstraction() {
        return SystemInstalledEventHandler;
    }
}
