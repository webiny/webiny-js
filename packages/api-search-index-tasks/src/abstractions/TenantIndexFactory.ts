import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface ITenantIndexConfig {
    index: string;
    settings?: GenericRecord;
}

export interface ITenantIndexFactory {
    getIndexList(tenant: Pick<Tenant, "id">): Promise<ITenantIndexConfig[]>;
}

export const TenantIndexFactory = createAbstraction<ITenantIndexFactory>(
    "OpenSearchTenantIndexFactory"
);

export namespace TenantIndexFactory {
    export type Interface = ITenantIndexFactory;
    export type IndexConfig = ITenantIndexConfig;
}
