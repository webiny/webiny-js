import { createAbstraction, Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant, CreateTenantInput } from "~/types/tenancy.js";
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

/** Create a new tenant. */
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

/** Persist a newly created tenant. */
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

/** Storage gateway for tenant creation. */
export const CreateTenantGateway = createAbstraction<ICreateTenantGateway>("CreateTenantGateway");

export namespace CreateTenantGateway {
    export type Interface = ICreateTenantGateway;
}

/** Hook into tenant lifecycle before a tenant is created. */
export const TenantBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantBeforeCreatePayload>>
>("TenantBeforeCreateEventHandler");

export namespace TenantBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantBeforeCreatePayload>>;
    export type Event = DomainEvent<TenantBeforeCreatePayload>;
}

/** Hook into tenant lifecycle after a tenant is created. */
export const TenantAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantAfterCreatePayload>>
>("TenantAfterCreateEventHandler");

export namespace TenantAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantAfterCreatePayload>>;
    export type Event = DomainEvent<TenantAfterCreatePayload>;
}
