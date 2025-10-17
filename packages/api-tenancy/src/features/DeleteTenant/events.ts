import type { DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
import { TenantBeforeDeleteHandler, TenantAfterDeleteHandler } from "./abstractions.js";

export interface TenantBeforeDeletePayload {
    tenant: Tenant;
}

export interface TenantAfterDeletePayload {
    tenant: Tenant;
}

export class TenantBeforeDeleteEvent implements DomainEvent<TenantBeforeDeletePayload> {
    eventType = "tenant.beforeDelete" as const;
    occurredAt: Date;

    constructor(public payload: TenantBeforeDeletePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantBeforeDeleteHandler;
    }
}

export class TenantAfterDeleteEvent implements DomainEvent<TenantAfterDeletePayload> {
    eventType = "tenant.afterDelete" as const;
    occurredAt: Date;

    constructor(public payload: TenantAfterDeletePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantAfterDeleteHandler;
    }
}
