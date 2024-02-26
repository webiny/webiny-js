import { createHandler } from "@webiny/handler-aws";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import subscribePlugins from "@webiny/api-prerendering-service-aws/render/subscriber";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        subscribePlugins({
            sqsQueueUrl: String(process.env.SQS_QUEUE),
            storageOperations: createPrerenderingServiceStorageOperations({
                table(table) {
                    return {
                        ...table,
                        name: String(process.env.DB_TABLE)
                    };
                },
                documentClient
            })
        })
    ]
});
