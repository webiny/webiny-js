import WebinyError from "@webiny/error";
import type { Client } from "@elastic/elasticsearch";
import { esGetIndexName, esGetIndexExist } from "~/utils/index.js";
import { elasticsearchIndexPlugins } from "~/utils/elasticsearch/plugins/index.js";

export interface EsCreateIndexParams {
    elasticsearchClient: Client;
    tenant: string;
    type: string;
    isHeadlessCmsModel: boolean;
}

export const esCreateIndex = async (params: EsCreateIndexParams): Promise<string> => {
    const { elasticsearchClient, tenant, type, isHeadlessCmsModel } = params;

    const indexName = esGetIndexName({ tenant, type, isHeadlessCmsModel });

    try {
        const exist = await esGetIndexExist(params);

        if (exist) {
            return indexName;
        }

        // Get registered plugins
        const plugin = elasticsearchIndexPlugins().pop();

        await elasticsearchClient.indices.create({
            index: indexName,
            ...(plugin && { body: plugin.body })
        });
        return indexName;
    } catch (ex) {
        // Despite the fact the above `esGetIndexExist` check told us the index does not exist,
        // we've seen cases where the `resource_already_exists_exception` would still be thrown
        // upon index creation. That's why we're doing an additional check of the error message.
        if (ex.message === "resource_already_exists_exception") {
            return indexName;
        }

        throw new WebinyError(
            ex.message || "Could not create Elasticsearch index.",
            ex.code || "CREATE_OPENSEARCH_INDEX_ERROR",
            {
                error: ex,
                tenant,
                type
            }
        );
    }
};
