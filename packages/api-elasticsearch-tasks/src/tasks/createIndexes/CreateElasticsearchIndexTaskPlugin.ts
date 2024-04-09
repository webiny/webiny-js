import { Plugin } from "@webiny/plugins";
import { Context } from "@webiny/api/types";
import { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types";

export interface CreateElasticsearchIndexTaskPluginIndex {
    index: string;
    settings?: Partial<ElasticsearchIndexRequestBody>;
}

export interface CreateElasticsearchIndexTaskPluginConfigParams<C extends Context> {
    context: C;
    tenant: string;
    locale: string;
}

export interface CreateElasticsearchIndexTaskPluginConfig<C extends Context> {
    name?: string;
    getIndexList(
        params: CreateElasticsearchIndexTaskPluginConfigParams<C>
    ): Promise<CreateElasticsearchIndexTaskPluginIndex[]>;
}

export class CreateElasticsearchIndexTaskPlugin<C extends Context> extends Plugin {
    public static override readonly type: string =
        "elasticsearch.createElasticsearchIndexTaskPlugin";

    private readonly config: CreateElasticsearchIndexTaskPluginConfig<C>;

    public constructor(config: CreateElasticsearchIndexTaskPluginConfig<C>) {
        super();
        this.name = config.name;
        this.config = config;
    }

    public getIndexList(
        params: CreateElasticsearchIndexTaskPluginConfigParams<C>
    ): Promise<CreateElasticsearchIndexTaskPluginIndex[]> {
        return this.config.getIndexList(params);
    }
}

export const createElasticsearchIndexTaskPlugin = <C extends Context>(
    config: CreateElasticsearchIndexTaskPluginConfig<C>
) => {
    return new CreateElasticsearchIndexTaskPlugin<C>(config);
};
