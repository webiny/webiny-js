import { createHandler } from "@webiny/handler-aws";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createLogger } from "@webiny/api-log";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        createLogger({
            documentClient,
            getTenant: () => {
                return "root";
            }
        }),
        elasticsearchClientContextPlugin({
            endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
        }),
        createEventHandler()
    ],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
