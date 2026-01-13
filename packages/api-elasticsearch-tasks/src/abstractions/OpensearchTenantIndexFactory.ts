import { createAbstraction } from "@webiny/feature/api";
import type { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface IOpensearchIndexConfig {
    index: string;
    settings?: Partial<ElasticsearchIndexRequestBody>;
}

export interface IOpensearchTenantIndexFactory {
    getIndexList(tenant: Pick<Tenant, "id">): Promise<IOpensearchIndexConfig[]>;
}

export const OpensearchTenantIndexFactory = createAbstraction<IOpensearchTenantIndexFactory>(
    "OpensearchTenantIndexFactory"
);

export namespace OpensearchTenantIndexFactory {
    export type Interface = IOpensearchTenantIndexFactory;
    export type IndexConfig = IOpensearchIndexConfig;
}
