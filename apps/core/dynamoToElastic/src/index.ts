import { createHandler } from "@webiny/handler-aws/raw";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";
import { createEventHandler as createDynamoDBEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

export const handler = createHandler({
    plugins: [
        elasticsearchClientContextPlugin({
            endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
        }),
        elasticsearchDataGzipCompression(),
        createDynamoDBEventHandler()
    ]
});
