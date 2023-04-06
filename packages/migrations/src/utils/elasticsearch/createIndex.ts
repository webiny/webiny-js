import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { getIndexName } from "~/utils";

export interface CreateElasticSearchIndexParams {
    elasticsearchClient: Client;
    tenant: string;
    locale: string;
    type: string;
    isHeadlessCmsModel: boolean;
}

export const createElasticSearchIndex = async (params: CreateElasticSearchIndexParams) => {
    const { elasticsearchClient, tenant, locale, type, isHeadlessCmsModel } = params;

    try {
        const index = getIndexName(tenant, locale, type, isHeadlessCmsModel);
        const response = await elasticsearchClient.indices.exists({
            index
        });

        if (response.body) {
            return;
        }

        await elasticsearchClient.indices.create({
            index
        });
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not create Elasticsearch index.",
            ex.code || "CREATE_ELASTICSEARCH_INDEX_ERROR",
            {
                error: ex,
                locale,
                tenant,
                type
            }
        );
    }
};
