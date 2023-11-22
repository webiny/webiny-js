import { Client } from "@elastic/elasticsearch";
import { ElasticsearchSearchResponse, SearchBody } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";

export interface EsQueryAllParams {
    elasticsearchClient: Client;
    index: string;
    body: SearchBody;
}

export const esQueryAll = async <TItem>({ elasticsearchClient, body, index }: EsQueryAllParams) => {
    const search = async (): Promise<ElasticsearchSearchResponse<TItem>> => {
        return elasticsearchClient.search({
            index,
            body
        });
    };

    const response = await executeWithRetry(search);

    return response.body.hits.hits.map(item => {
        return item._source;
    });
};
