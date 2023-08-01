import { ElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

interface Params {
    client: ElasticsearchClient;
    index: string;
}

export const fetchFromElasticsearch = async (params: Params) => {
    const { client, index } = params;
    const result = await client.search({
        index
    });
    return result.body?.hits?.hits[0]?._source;
};
