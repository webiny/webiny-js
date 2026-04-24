import { createAbstraction } from "@webiny/feature/api";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface IOpensearchIndexConfig {
    index: string;
    settings?: Partial<OpenSearchIndexRequestBody>;
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
