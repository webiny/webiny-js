import { createHandler } from "@webiny/handler-aws";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import dynamoDBToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";

export const handler = createHandler(
    elasticsearchClientContextPlugin({
        endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
    }),
    dynamoDBToElastic()
);
