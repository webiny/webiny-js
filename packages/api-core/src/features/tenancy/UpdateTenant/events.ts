import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantBeforeUpdateHandler, TenantAfterUpdateHandler } from "./abstractions.js";

export interface TenantBeforeUpdatePayload {
    tenant: Tenant;
    inputData: Record<string, any>;
    updateData: Partial<Tenant>;
}

export interface TenantAfterUpdatePayload {
    tenant: Tenant;
    inputData: Record<string, any>;
}

export class TenantBeforeUpdateEvent extends DomainEvent<TenantBeforeUpdatePayload> {
    eventType = "tenant.beforeUpdate" as const;

    getHandlerAbstraction() {
        return TenantBeforeUpdateHandler;
    }
}

export class TenantAfterUpdateEvent extends DomainEvent<TenantAfterUpdatePayload> {
    eventType = "tenant.afterUpdate" as const;

    getHandlerAbstraction() {
        return TenantAfterUpdateHandler;
    }
}
