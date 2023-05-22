import { Client } from "@elastic/elasticsearch";
import {
    SearchBody,
    ElasticsearchSearchResponse,
    PrimitiveValue
} from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";

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
    let cursor: PrimitiveValue[] | undefined = body.search_after;
    while (true) {
        const bodyWithCursor = { ...body, search_after: cursor };

        const search = (): Promise<ElasticsearchSearchResponse<TItem>> => {
            return elasticsearchClient.search({
                index,
                body: bodyWithCursor
            });
        };

        const response = await executeWithRetry(search);

        const hits = response.body.hits;
        if (hits.hits.length <= 0) {
            break;
        }

        cursor = hits.hits[hits.hits.length - 1].sort as unknown as string[];
        await callback(
            hits.hits.map(item => item._source),
            cursor as string[]
        );
    }
};
