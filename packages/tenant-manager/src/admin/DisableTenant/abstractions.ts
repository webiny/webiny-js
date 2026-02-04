import { createAbstraction } from "@webiny/feature/admin";

// UseCase abstraction - only execute method
export interface IDisableTenantUseCase {
    execute(tenantId: string): Promise<void>;
}

export const DisableTenantUseCase =
    createAbstraction<IDisableTenantUseCase>("DisableTenantUseCase");

export namespace DisableTenantUseCase {
    export type Interface = IDisableTenantUseCase;
}

// Repository abstraction - delegates to gateway
export interface IDisableTenantRepository {
    execute(tenantId: string): Promise<void>;
}

export const DisableTenantRepository =
    createAbstraction<IDisableTenantRepository>("DisableTenantRepository");

export namespace DisableTenantRepository {
    export type Interface = IDisableTenantRepository;
}

// Gateway abstraction - GraphQL call
export interface IDisableTenantGateway {
    disableTenant(tenantId: string): Promise<boolean>;
}

export const DisableTenantGateway =
    createAbstraction<IDisableTenantGateway>("DisableTenantGateway");

export namespace DisableTenantGateway {
    export type Interface = IDisableTenantGateway;
}
