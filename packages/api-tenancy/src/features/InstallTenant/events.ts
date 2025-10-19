import { DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
import { TenantInstalledHandler } from "./abstractions.js";

export interface TenantInstalledPayload {
    tenant: Tenant;
    installedApps: string[];
}

export class TenantInstalledEvent extends DomainEvent<TenantInstalledPayload> {
    eventType = "tenant.installed" as const;

    getHandlerAbstraction() {
        return TenantInstalledHandler;
    }
}
