import type { DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
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

export class TenantBeforeUpdateEvent implements DomainEvent<TenantBeforeUpdatePayload> {
    eventType = "tenant.beforeUpdate" as const;
    occurredAt: Date;

    constructor(public payload: TenantBeforeUpdatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantBeforeUpdateHandler;
    }
}

export class TenantAfterUpdateEvent implements DomainEvent<TenantAfterUpdatePayload> {
    eventType = "tenant.afterUpdate" as const;
    occurredAt: Date;

    constructor(public payload: TenantAfterUpdatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantAfterUpdateHandler;
    }
}
