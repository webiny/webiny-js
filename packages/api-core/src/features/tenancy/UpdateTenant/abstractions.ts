import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant } from "~/types/tenancy.js";
import type { TenantBeforeUpdatePayload, TenantAfterUpdatePayload } from "./events.js";

export type UpdateTenantError = { type: "NOT_FOUND" } | { type: "UNKNOWN"; cause: Error };

export interface IUpdateTenantUseCase {
    execute(id: string, data: Partial<Tenant>): Promise<Result<Tenant, UpdateTenantError>>;
}

/** Update an existing tenant. */
export const UpdateTenantUseCase = createAbstraction<IUpdateTenantUseCase>("UpdateTenantUseCase");

export namespace UpdateTenantUseCase {
    export type Interface = IUpdateTenantUseCase;
}

export interface IUpdateTenantRepository {
    update(tenant: Tenant): Promise<Tenant>;
}

/** Persist tenant updates. */
export const UpdateTenantRepository =
    createAbstraction<IUpdateTenantRepository>("UpdateTenantRepository");

export namespace UpdateTenantRepository {
    export type Interface = IUpdateTenantRepository;
}

export interface IUpdateTenantGateway {
    updateTenant(data: Tenant): Promise<Tenant>;
}

/** Storage gateway for tenant updates. */
export const UpdateTenantGateway = createAbstraction<IUpdateTenantGateway>("UpdateTenantGateway");

export namespace UpdateTenantGateway {
    export type Interface = IUpdateTenantGateway;
}

/** Hook into tenant lifecycle before a tenant is updated. */
export const TenantBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantBeforeUpdatePayload>>
>("TenantBeforeUpdateEventHandler");

export namespace TenantBeforeUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantBeforeUpdatePayload>>;
    export type Event = DomainEvent<TenantBeforeUpdatePayload>;
}

/** Hook into tenant lifecycle after a tenant is updated. */
export const TenantAfterUpdateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantAfterUpdatePayload>>
>("TenantAfterUpdateEventHandler");

export namespace TenantAfterUpdateEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantAfterUpdatePayload>>;
    export type Event = DomainEvent<TenantAfterUpdatePayload>;
}
