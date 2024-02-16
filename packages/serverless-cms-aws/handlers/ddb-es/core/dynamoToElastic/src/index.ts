import { createHandler } from "@webiny/handler-aws";
import elasticsearchClientContextPlugin, { createGzipCompression } from "@webiny/api-elasticsearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

export const handler = createHandler({
    plugins: [
        elasticsearchClientContextPlugin({
            endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
        }),
        createGzipCompression(),
        createEventHandler()
    ],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
