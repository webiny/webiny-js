import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "@webiny/api-core";
import type { Tenant } from "~/types.js";
import type { TenantBeforeUpdatePayload, TenantAfterUpdatePayload } from "./events.js";

export type UpdateTenantError = { type: "NOT_FOUND" } | { type: "UNKNOWN"; cause: Error };

export interface IUpdateTenantUseCase {
    execute(id: string, data: Partial<Tenant>): Promise<Result<Tenant, UpdateTenantError>>;
}

export const UpdateTenantUseCase = createAbstraction<IUpdateTenantUseCase>("UpdateTenantUseCase");

export namespace UpdateTenantUseCase {
    export type Interface = IUpdateTenantUseCase;
}

export interface IUpdateTenantRepository {
    update(tenant: Tenant): Promise<Tenant>;
}

export const UpdateTenantRepository =
    createAbstraction<IUpdateTenantRepository>("UpdateTenantRepository");

export namespace UpdateTenantRepository {
    export type Interface = IUpdateTenantRepository;
}

export interface IUpdateTenantGateway {
    updateTenant(data: Tenant): Promise<Tenant>;
}

export const UpdateTenantGateway = createAbstraction<IUpdateTenantGateway>("UpdateTenantGateway");

export namespace UpdateTenantGateway {
    export type Interface = IUpdateTenantGateway;
}

export const TenantBeforeUpdateHandler = createAbstraction<IEventHandler<DomainEvent<TenantBeforeUpdatePayload>>>(
    "TenantBeforeUpdateHandler"
);

export namespace TenantBeforeUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<TenantBeforeUpdatePayload>>;
    export type Event = DomainEvent<TenantBeforeUpdatePayload>;
}

export const TenantAfterUpdateHandler = createAbstraction<IEventHandler<DomainEvent<TenantAfterUpdatePayload>>>(
    "TenantAfterUpdateHandler"
);

export namespace TenantAfterUpdateHandler {
    export type Interface = IEventHandler<DomainEvent<TenantAfterUpdatePayload>>;
    export type Event = DomainEvent<TenantAfterUpdatePayload>;
}
