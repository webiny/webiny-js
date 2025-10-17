import type { DomainEvent } from "@webiny/api-core";
import type { Tenant, CreateTenantInput } from "~/types.js";
import { TenantBeforeCreateHandler, TenantAfterCreateHandler } from "./abstractions.js";

export interface TenantBeforeCreatePayload {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export interface TenantAfterCreatePayload {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export class TenantBeforeCreateEvent implements DomainEvent<TenantBeforeCreatePayload> {
    eventType = "tenant.beforeCreate" as const;
    occurredAt: Date;

    constructor(public payload: TenantBeforeCreatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantBeforeCreateHandler;
    }
}

export class TenantAfterCreateEvent implements DomainEvent<TenantAfterCreatePayload> {
    eventType = "tenant.afterCreate" as const;
    occurredAt: Date;

    constructor(public payload: TenantAfterCreatePayload) {
        this.occurredAt = new Date();
    }

    getHandlerAbstraction() {
        return TenantAfterCreateHandler;
    }
}
