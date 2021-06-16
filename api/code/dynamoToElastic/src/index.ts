import { createHandler } from "@webiny/handler-aws";
import elasticSearch from "@webiny/api-elasticsearch";
import dynamoDBToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import logsPlugins from "@webiny/handler-logs";

export const handler = createHandler(
    logsPlugins(),
    elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
    dynamoDBToElastic()
);
