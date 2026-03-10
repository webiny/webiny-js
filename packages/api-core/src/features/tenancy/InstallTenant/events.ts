import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantInstalledEventHandler } from "./abstractions.js";

export interface TenantInstalledPayload {
    tenant: Tenant;
    installedApps: string[];
}

export class TenantInstalledEvent extends DomainEvent<TenantInstalledPayload> {
    eventType = "tenant.installed" as const;

    getHandlerAbstraction() {
        return TenantInstalledEventHandler;
    }
}
