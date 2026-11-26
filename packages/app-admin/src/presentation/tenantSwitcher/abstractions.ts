import { createAbstraction } from "@webiny/feature/admin";

export interface ITenantSwitcherTenant {
    id: string;
    name: string;
    /**
     * URL of the tenant's logo, or `null` when it has none.
     */
    logo: string | null;
    /**
     * Up to two letters, shown in place of a missing logo.
     */
    initials: string;
    /**
     * Root shows the admin's own logo and title rather than a tenant logo.
     */
    isRoot: boolean;
}

export interface ITenantSwitcherViewModel {
    /**
     * The tenant the admin is open in, or `null` until it loads.
     */
    current: ITenantSwitcherTenant | null;
    tenants: ITenantSwitcherTenant[];
    canSwitch: boolean;
    canSearch: boolean;
    search: string;
    loading: boolean;
}

export interface ITenantSwitcherPresenter {
    readonly vm: ITenantSwitcherViewModel;
    /**
     * Loads the current tenant and the tenants to switch to. Safe to call from every component that
     * shows the switcher: it loads once.
     */
    init(): Promise<void>;
    setSearch(search: string): void;
    switchTo(tenantId: string): void;
}

export const TenantSwitcherPresenter =
    createAbstraction<ITenantSwitcherPresenter>("TenantSwitcherPresenter");

export namespace TenantSwitcherPresenter {
    export type Interface = ITenantSwitcherPresenter;
    export type ViewModel = ITenantSwitcherViewModel;
    export type Tenant = ITenantSwitcherTenant;
}
