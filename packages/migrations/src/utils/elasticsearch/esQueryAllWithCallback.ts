import { Client } from "@elastic/elasticsearch";
import { SearchBody, ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";
import WebinyError from "@webiny/error";

export interface EsQueryAllParams<TItem> {
    elasticsearchClient: Client;
    index: string;
    body: SearchBody;
    callback: (items: TItem[], cursor: string[]) => Promise<void>;
}

export const esQueryAllWithCallback = async <TItem>({
    elasticsearchClient,
    body,
    index,
    callback
}: EsQueryAllParams<TItem>) => {
    try {
        let cursor: string[] | undefined = undefined;
        while (true) {
            const bodyWithCursor = { ...body, search_after: cursor };
            const response: ElasticsearchSearchResponse<TItem> = await elasticsearchClient.search({
                index,
                body: bodyWithCursor
            });
            const hits = response.body.hits;
            if (hits.hits.length > 0) {
                cursor = hits.hits[hits.hits.length - 1].sort as unknown as string[];
                await callback(
                    hits.hits.map(item => item._source),
                    cursor
                );

                continue;
            }
            break;
        }
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Error in the Elasticsearch query.",
            ex.code || "ELASTICSEARCH_ERROR",
            { body }
        );
    }
};
