import type { DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
import { TenantInstalledHandler } from "./abstractions.js";

export interface TenantInstalledPayload {
    tenant: Tenant;
    installedApps: string[];
}

export class TenantInstalledEvent implements DomainEvent<TenantInstalledPayload> {
    eventType = "tenant.installed" as const;
    occurredAt: Date;

    constructor(public payload: TenantInstalledPayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantInstalledHandler;
    }
}
