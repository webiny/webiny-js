import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws/eventBridge";
import subscribePlugins from "@webiny/api-prerendering-service-aws/render/subscriber";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        subscribePlugins({
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
