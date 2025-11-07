import { type CreateTenantInput, Tenant } from "~/types/tenancy.js";
import { TenantBeforeCreateHandler, TenantAfterCreateHandler } from "./abstractions.js";
import { DomainEvent } from "~/features/eventPublisher/index.js";

export interface TenantBeforeCreatePayload {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export interface TenantAfterCreatePayload {
    tenant: Tenant;
    input: CreateTenantInput & Record<string, any>;
}

export class TenantBeforeCreateEvent extends DomainEvent<TenantBeforeCreatePayload> {
    eventType = "tenant.beforeCreate" as const;

    getHandlerAbstraction() {
        return TenantBeforeCreateHandler;
    }
}

export class TenantAfterCreateEvent extends DomainEvent<TenantAfterCreatePayload> {
    eventType = "tenant.afterCreate" as const;

    getHandlerAbstraction() {
        return TenantAfterCreateHandler;
    }
}
