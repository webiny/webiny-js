import { DomainEvent } from "@webiny/api-core";
import { SystemInstalledHandler } from "./abstractions.js";

export class SystemInstalledEvent extends DomainEvent {
    eventType = "system.installed" as const;

    getHandlerAbstraction() {
        return SystemInstalledHandler;
    }
}
