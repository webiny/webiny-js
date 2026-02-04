import { createAbstraction } from "@webiny/feature/admin";

// UseCase abstraction - only execute method
export interface IEnableTenantUseCase {
    execute(tenantId: string): Promise<void>;
}

export const EnableTenantUseCase = createAbstraction<IEnableTenantUseCase>("EnableTenantUseCase");

export namespace EnableTenantUseCase {
    export type Interface = IEnableTenantUseCase;
}

// Repository abstraction - delegates to gateway
export interface IEnableTenantRepository {
    execute(tenantId: string): Promise<void>;
}

export const EnableTenantRepository =
    createAbstraction<IEnableTenantRepository>("EnableTenantRepository");

export namespace EnableTenantRepository {
    export type Interface = IEnableTenantRepository;
}

// Gateway abstraction - GraphQL call
export interface IEnableTenantGateway {
    enableTenant(tenantId: string): Promise<boolean>;
}

export const EnableTenantGateway = createAbstraction<IEnableTenantGateway>("EnableTenantGateway");

export namespace EnableTenantGateway {
    export type Interface = IEnableTenantGateway;
}
