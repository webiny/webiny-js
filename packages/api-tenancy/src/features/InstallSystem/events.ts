import type { DomainEvent } from "@webiny/api-core";
import { SystemInstalledHandler } from "./abstractions.js";

export class SystemInstalledEvent implements DomainEvent {
    eventType = "system.installed" as const;
    occurredAt: Date;

    constructor() {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return SystemInstalledHandler;
    }
}
