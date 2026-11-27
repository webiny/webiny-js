import { createAbstraction } from "@webiny/feature/admin";

export interface ISwitcherTenant {
    id: string;
    name: string;
    /**
     * URL of the tenant's logo, or `null` when it has none.
     */
    logo: string | null;
}

/**
 * Where the tenant switcher gets its tenants. The default reads the identity: the tenants a user is
 * linked to. Tenant Manager decorates it, so root admins get every tenant, with search.
 */
export interface ITenantSwitcherSource {
    /**
     * The tenant the admin is open in.
     */
    getCurrentTenant(): Promise<ISwitcherTenant>;
    /**
     * The tenants to offer, the current one included. With `search`, only those whose name contains it.
     */
    listTenants(search?: string): Promise<ISwitcherTenant[]>;
    /**
     * Whether the identity can switch tenants at all.
     */
    canSwitch(): boolean;
    /**
     * Whether `listTenants` takes a search, so the switcher shows a search field.
     */
    canSearch(): boolean;
}

export const TenantSwitcherSource =
    createAbstraction<ITenantSwitcherSource>("TenantSwitcherSource");

export namespace TenantSwitcherSource {
    export type Interface = ITenantSwitcherSource;
    export type Tenant = ISwitcherTenant;
}

/**
 * The tenants this browser switched to last, newest first. The switcher shows them before the rest,
 * so a root admin with many tenants finds the ones they use without searching.
 */
export interface IRecentTenantsRepository {
    list(): ISwitcherTenant[];
    /**
     * Puts the tenant first. Root is never stored: the switcher always shows it.
     */
    remember(tenant: ISwitcherTenant): void;
}

export const RecentTenantsRepository =
    createAbstraction<IRecentTenantsRepository>("RecentTenantsRepository");

export namespace RecentTenantsRepository {
    export type Interface = IRecentTenantsRepository;
}
