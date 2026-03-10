import { createAbstraction, Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "~/features/eventPublisher/index.js";
import type { Tenant } from "~/types/tenancy.js";
import type { TenantInstalledPayload } from "./events.js";
import { InstallTenantError, InstallationDependencyError } from "./errors.js";

export type { Tenant };

/**
 * Errors
 */
export interface IInstallTenantErrors {
    base: InstallTenantError;
    dependency: InstallationDependencyError;
}

/**
 * Types
 */
export interface AppInstallationData {
    app: string;
    data: Record<string, any>;
}

export interface TenantInstallationInput {
    tenant: Tenant;
    installationInput: AppInstallationData[];
}

/**
 * App Installer Abstraction
 */
export interface IAppInstaller<TData = Record<string, any>> {
    readonly alwaysRun?: boolean;
    readonly appName: string;
    readonly dependsOn: string[];

    /**
     * Perform the installation
     * If this succeeds, uninstall() MUST be able to revert it
     */
    install(tenant: Tenant, data: TData): Promise<void>;

    /**
     * Revert the installation
     * Called if any subsequent installer fails
     */
    uninstall(tenant: Tenant): Promise<void>;
}

export const AppInstaller = createAbstraction<IAppInstaller>("AppInstaller");

export namespace AppInstaller {
    export type Interface<T = any> = IAppInstaller<T>;
}

/**
 * Use Case Abstraction
 */
export interface IInstallTenantUseCase {
    execute(
        input: TenantInstallationInput
    ): Promise<Result<void, IInstallTenantErrors[keyof IInstallTenantErrors]>>;
}

export const InstallTenantUseCase =
    createAbstraction<IInstallTenantUseCase>("InstallTenantUseCase");

export namespace InstallTenantUseCase {
    export type Interface = IInstallTenantUseCase;
    export type Input = TenantInstallationInput;
    export type Errors = IInstallTenantErrors[keyof IInstallTenantErrors];
}

/**
 * Event Handler Abstraction
 */
export const TenantInstalledEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantInstalledPayload>>
>("TenantInstalledEventHandler");

export namespace TenantInstalledEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantInstalledPayload>>;
    export type Event = DomainEvent<TenantInstalledPayload>;
}
