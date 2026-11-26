import { createAbstraction } from "@webiny/feature/admin";
import type { ISwitcherTenant } from "~/features/tenantSwitcher/abstractions.js";

export interface ITenantSwitcherViewModel {
    /**
     * The tenant the admin is open in, or `null` until it loads.
     */
    current: ISwitcherTenant | null;
    tenants: ISwitcherTenant[];
    canSwitch: boolean;
    canSearch: boolean;
    search: string;
    loading: boolean;
}

export interface ITenantSwitcherPresenter {
    readonly vm: ITenantSwitcherViewModel;
    init(): Promise<void>;
    setSearch(search: string): void;
    switchTo(tenantId: string): void;
}

export const TenantSwitcherPresenter =
    createAbstraction<ITenantSwitcherPresenter>("TenantSwitcherPresenter");

export namespace TenantSwitcherPresenter {
    export type Interface = ITenantSwitcherPresenter;
    export type ViewModel = ITenantSwitcherViewModel;
    export type Tenant = ISwitcherTenant;
}
