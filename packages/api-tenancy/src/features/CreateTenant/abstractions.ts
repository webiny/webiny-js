import { createAbstraction, Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "@webiny/api-core";
import type { Tenant, CreateTenantInput } from "~/types.js";
import type { TenantBeforeCreatePayload, TenantAfterCreatePayload } from "./events.js";
import { CreateTenantError } from "./errors.js";

/**
 * Errors
 */
export interface ICreateTenantErrors {
    base: CreateTenantError;
}

/**
 * Use Case
 */
export interface ICreateTenantUseCase {
    execute(
        data: CreateTenantInput
    ): Promise<Result<Tenant, ICreateTenantErrors[keyof ICreateTenantErrors]>>;
}

export const CreateTenantUseCase = createAbstraction<ICreateTenantUseCase>("CreateTenantUseCase");

export namespace CreateTenantUseCase {
    export type Interface = ICreateTenantUseCase;
    export type Errors = ICreateTenantErrors[keyof ICreateTenantErrors];
}

/**
 * Repository
 */
export interface ICreateTenantRepository {
    create(tenant: Tenant): Promise<Tenant>;
}

export const CreateTenantRepository =
    createAbstraction<ICreateTenantRepository>("CreateTenantRepository");

export namespace CreateTenantRepository {
    export type Interface = ICreateTenantRepository;
}

/**
 * Gateway
 */
export interface ICreateTenantGateway {
    createTenant(data: Tenant): Promise<Tenant>;
}

export const CreateTenantGateway = createAbstraction<ICreateTenantGateway>("CreateTenantGateway");

export namespace CreateTenantGateway {
    export type Interface = ICreateTenantGateway;
}

/**
 * Event Handlers
 */
export const TenantBeforeCreateHandler = createAbstraction<IEventHandler<DomainEvent<TenantBeforeCreatePayload>>>(
    "TenantBeforeCreateHandler"
);

export namespace TenantBeforeCreateHandler {
    export type Interface = IEventHandler<DomainEvent<TenantBeforeCreatePayload>>;
    export type Event = DomainEvent<TenantBeforeCreatePayload>;
}

export const TenantAfterCreateHandler = createAbstraction<IEventHandler<DomainEvent<TenantAfterCreatePayload>>>(
    "TenantAfterCreateHandler"
);

export namespace TenantAfterCreateHandler {
    export type Interface = IEventHandler<DomainEvent<TenantAfterCreatePayload>>;
    export type Event = DomainEvent<TenantAfterCreatePayload>;
}
