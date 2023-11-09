import { Client } from "@elastic/elasticsearch";
import { esGetIndexName } from "~/utils";

export interface GetIndexExistParams {
    elasticsearchClient: Promise<Client> | Client;
    tenant: string;
    locale: string;
    type: string;
    isHeadlessCmsModel?: boolean;
}

export const esGetIndexExist = async (params: GetIndexExistParams) => {
    const {
        elasticsearchClient: initialElasticsearchClient,
        tenant,
        locale,
        type,
        isHeadlessCmsModel
    } = params;

    const elasticsearchClient = await initialElasticsearchClient;
    try {
        const index = esGetIndexName({ tenant, locale, type, isHeadlessCmsModel });

        const response = await elasticsearchClient.indices.exists({
            index
        });

        if (response.body) {
            return true;
        }

        return false;
    } catch (ex) {
        console.warn(`Could not find Elasticsearch index:`, ex.message);
        return false;
    }
};
