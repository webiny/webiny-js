import { createAbstraction } from "@webiny/feature/api";
import type { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types.js";

export interface IOpensearchIndexConfig {
    index: string;
    settings?: Partial<ElasticsearchIndexRequestBody>;
}

export interface IOpensearchTenantIndexFactory {
    getIndexList(tenant: string): Promise<IOpensearchIndexConfig[]>;
}

export const OpensearchTenantIndexFactory = createAbstraction<IOpensearchTenantIndexFactory>(
    "OpensearchTenantIndexFactory"
);

export namespace OpensearchTenantIndexFactory {
    export type Interface = IOpensearchTenantIndexFactory;
    export type IndexConfig = IOpensearchIndexConfig;
}
