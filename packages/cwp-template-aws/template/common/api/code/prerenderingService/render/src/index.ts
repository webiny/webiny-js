import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import renderPlugins from "@webiny/api-prerendering-service/render";
import renderAwsPlugins from "@webiny/api-prerendering-service-aws/render";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: String(process.env.AWS_REGION)
});

export const handler = createHandler(
    renderPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            table(table) {
                return {
                    ...table,
                    name: String(process.env.DB_TABLE)
                };
            },
            documentClient
        })
    }),
    renderAwsPlugins()
);
