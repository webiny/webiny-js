import { Client } from "@elastic/elasticsearch";
import { SearchBody, ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";

export interface EsFindOneParams {
    elasticsearchClient: Client;
    index: string;
    body: Omit<SearchBody, "size">;
}

export const esFindOne = async <TItem>({ elasticsearchClient, body, index }: EsFindOneParams) => {
    const response: ElasticsearchSearchResponse<TItem> = await elasticsearchClient.search({
        index,
        body: {
            ...body,
            size: 1
        }
    });

    const hits = response.body.hits;

    if (hits.hits.length <= 0) {
        return null;
    }

    return hits.hits[0]._source;
};
