import { createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";

export interface ITenantCache {
    get(id: string): Promise<Tenant>;
    getMany(ids: readonly string[]): Promise<Tenant[]>;
    clear(id: string): void;
    prime(id: string, tenant: Tenant | undefined): void;
}

export const TenantCache = createAbstraction<ITenantCache>("TenantCache");

export namespace TenantCache {
    export type Interface = ITenantCache;
}
