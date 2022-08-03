import { createHandler } from "@webiny/handler-fastify-aws/dynamodb";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

export const handler = createHandler({
    plugins: [
        elasticsearchClientContextPlugin({
            endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
        }),
        elasticsearchDataGzipCompression(),
        createEventHandler()
    ]
});
