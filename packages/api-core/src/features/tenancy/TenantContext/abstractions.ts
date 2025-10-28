import { createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

export interface ITenantContext {
    setTenant(tenant: Tenant): void;
    getTenant(): Tenant;
    withRootTenant<T>(cb: () => T): Promise<T>;
    withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]>;
    withTenant<TReturn>(tenant: Tenant, cb: (tenant: Tenant) => Promise<TReturn>): Promise<TReturn>;
}

export const TenantContext = createAbstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
    export type Interface = ITenantContext;
}
