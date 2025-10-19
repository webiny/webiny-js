import { DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
import { TenantBeforeDeleteHandler, TenantAfterDeleteHandler } from "./abstractions.js";

export interface TenantBeforeDeletePayload {
    tenant: Tenant;
}

export interface TenantAfterDeletePayload {
    tenant: Tenant;
}

export class TenantBeforeDeleteEvent extends DomainEvent<TenantBeforeDeletePayload> {
    eventType = "tenant.beforeDelete" as const;

    getHandlerAbstraction() {
        return TenantBeforeDeleteHandler;
    }
}

export class TenantAfterDeleteEvent extends DomainEvent<TenantAfterDeletePayload> {
    eventType = "tenant.afterDelete" as const;

    getHandlerAbstraction() {
        return TenantAfterDeleteHandler;
    }
}
