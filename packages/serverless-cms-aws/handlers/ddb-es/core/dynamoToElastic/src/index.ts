import { createHandler } from "@webiny/handler-aws";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";
import dynamoDBToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";

export const handler = createHandler({
    plugins: [
        elasticsearchClientContextPlugin({
            endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
        }),
        elasticsearchDataGzipCompression(),
        dynamoDBToElastic()
    ]
});
