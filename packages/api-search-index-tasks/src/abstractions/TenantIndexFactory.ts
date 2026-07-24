import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { Tenant as BaseTenant } from "@webiny/api-core/types/tenancy.js";

export interface ITenantIndexConfig {
    index: string;
    settings?: GenericRecord;
}

export type ITenant = Pick<BaseTenant, "id">;

export interface ITenantIndexFactory {
    getIndexList(tenant: ITenant): Promise<ITenantIndexConfig[]>;
}

export const TenantIndexFactory = createAbstraction<ITenantIndexFactory>(
    "SearchIndexTenantIndexFactory"
);

export namespace TenantIndexFactory {
    export type Interface = ITenantIndexFactory;
    export type IndexConfig = ITenantIndexConfig;
    export type Tenant = ITenant;
}
