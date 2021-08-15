import { createHandler } from "@webiny/handler-aws";
import elasticSearch from "@webiny/api-elasticsearch";
import dynamoDBToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import logsPlugins from "@webiny/handler-logs";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";

export const handler = createHandler({
    plugins: [
        logsPlugins(),
        elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
        elasticsearchDataGzipCompression(),
        dynamoDBToElastic()
    ]
});
