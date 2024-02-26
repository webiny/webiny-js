import { Client } from "@elastic/elasticsearch";
import { SearchBody } from "elastic-ts";

interface ListElasticsearchItemsParams {
    index: string;
    client: Client;
    body?: SearchBody;
}

export const listElasticsearchItems = async <T = any>(
    params: ListElasticsearchItemsParams
): Promise<T[]> => {
    const { index, client, body } = params;
    try {
        const result = await client.search({
            index,
            body: {
                size: 1000000,
                ...body
            }
        });
        if (!result.body?.hits?.hits) {
            return [];
        }
        return result.body.hits.hits.map((item: any) => item._source as T);
    } catch (ex) {
        console.log(`Listing all Elasticsearch items, in index "${index}" failed.`);
        throw ex;
    }
};
