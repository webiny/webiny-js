import { createAbstraction } from "@webiny/feature/api";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface IOpenSearchIndexConfig {
    index: string;
    settings?: Partial<OpenSearchIndexRequestBody>;
}

export interface IOpenSearchTenantIndexFactory {
    getIndexList(tenant: Pick<Tenant, "id">): Promise<IOpenSearchIndexConfig[]>;
}

export const OpenSearchTenantIndexFactory = createAbstraction<IOpenSearchTenantIndexFactory>(
    "OpenSearchTenantIndexFactory"
);

export namespace OpenSearchTenantIndexFactory {
    export type Interface = IOpenSearchTenantIndexFactory;
    export type IndexConfig = IOpenSearchIndexConfig;
    export type IndexConfigBody = OpenSearchIndexRequestBody;
}
