import { createAbstraction } from "@webiny/feature/admin";

export interface IInstallTenantUseCase {
    execute(tenantId: string): Promise<void>;
}

export const InstallTenantUseCase =
    createAbstraction<IInstallTenantUseCase>("InstallTenantUseCase");

export namespace InstallTenantUseCase {
    export type Interface = IInstallTenantUseCase;
}

export interface IInstallTenantRepository {
    execute(tenantId: string): Promise<void>;
}

export const InstallTenantRepository =
    createAbstraction<IInstallTenantRepository>("InstallTenantRepository");

export namespace InstallTenantRepository {
    export type Interface = IInstallTenantRepository;
}

export interface IInstallTenantGateway {
    installTenant(tenantId: string): Promise<boolean>;
}

export const InstallTenantGateway =
    createAbstraction<IInstallTenantGateway>("InstallTenantGateway");

export namespace InstallTenantGateway {
    export type Interface = IInstallTenantGateway;
}
