import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantBeforeDeleteEventHandler, TenantAfterDeleteEventHandler } from "./abstractions.js";

export interface TenantBeforeDeletePayload {
    tenant: Tenant;
}

export interface TenantAfterDeletePayload {
    tenant: Tenant;
}

export class TenantBeforeDeleteEvent extends DomainEvent<TenantBeforeDeletePayload> {
    eventType = "tenant.beforeDelete" as const;

    getHandlerAbstraction() {
        return TenantBeforeDeleteEventHandler;
    }
}

export class TenantAfterDeleteEvent extends DomainEvent<TenantAfterDeletePayload> {
    eventType = "tenant.afterDelete" as const;

    getHandlerAbstraction() {
        return TenantAfterDeleteEventHandler;
    }
}
