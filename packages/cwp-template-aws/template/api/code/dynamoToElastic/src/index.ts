import { createHandler } from "@webiny/handler-aws";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import dynamoDBToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";

export const handler = createHandler(
    elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
    dynamoDBToElastic()
);
