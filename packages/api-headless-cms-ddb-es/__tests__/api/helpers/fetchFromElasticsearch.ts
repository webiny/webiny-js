import type { TestOpenSearchClient } from "@webiny/api-opensearch/testing";

interface Params {
    client: TestOpenSearchClient;
    index: string;
}

export const fetchFromElasticsearch = async (params: Params) => {
    const { client, index } = params;
    const result = await client.search({
        index
    });
    return result.body?.hits?.hits[0]?._source;
};
