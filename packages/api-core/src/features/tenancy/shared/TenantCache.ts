import DataLoader from "dataloader";
import type { TenantCache as CacheAbstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";

export interface TenantCacheBatchLoader {
    (ids: readonly string[]): Promise<Tenant[]>;
}

export class TenantCache implements CacheAbstraction.Interface {
    private loader: DataLoader<string, Tenant>;

    constructor(batchLoadFn: TenantCacheBatchLoader) {
        this.loader = new DataLoader<string, Tenant>(batchLoadFn);
    }

    async get(id: string): Promise<Tenant> {
        return (await this.loader.load(id)) as Tenant;
    }

    async getMany(ids: readonly string[]): Promise<Tenant[]> {
        return (await this.loader.loadMany(ids)) as Tenant[];
    }

    clear(id: string): void {
        this.loader.clear(id);
    }

    prime(id: string, tenant: Tenant | undefined): void {
        this.loader.prime(id, tenant as Tenant);
    }
}
