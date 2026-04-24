import { createAbstraction } from "@webiny/feature/admin";
import type { Tenant } from "../../shared/Tenant.js";

// Presenter
export interface ICurrentTenantVm {
    loading: boolean;
    tenant: Tenant | undefined;
    error: Error | undefined;
}

export interface ICurrentTenantPresenter {
    vm: ICurrentTenantVm;
    init(): void;
}

export const CurrentTenantPresenter =
    createAbstraction<ICurrentTenantPresenter>("CurrentTenantPresenter");

export namespace CurrentTenantPresenter {
    export type Interface = ICurrentTenantPresenter;
    export type ViewModel = ICurrentTenantVm;
}

// Repository
export interface ICurrentTenantRepository {
    getTenant(): Tenant | undefined;
    getError(): Error | undefined;
    loadTenant(): Promise<void>;
}

export const CurrentTenantRepository =
    createAbstraction<ICurrentTenantRepository>("CurrentTenantRepository");

export namespace CurrentTenantRepository {
    export type Interface = ICurrentTenantRepository;
}

// Gateway
export interface ICurrentTenantGateway {
    getTenant(): Promise<Tenant>;
}

export const CurrentTenantGateway =
    createAbstraction<ICurrentTenantGateway>("CurrentTenantGateway");

export namespace CurrentTenantGateway {
    export type Interface = ICurrentTenantGateway;
}
