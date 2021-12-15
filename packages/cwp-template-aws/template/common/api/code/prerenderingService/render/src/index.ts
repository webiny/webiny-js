import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import renderPlugins from "@webiny/api-prerendering-service/render";
import renderAwsPlugins from "@webiny/api-prerendering-service-aws/render";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION as string
});

export const handler = createHandler(
    renderPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            table: (table: any) => {
                return {
                    ...table,
                    name: process.env.DB_TABLE as string
                };
            },
            documentClient
        })
    }),
    renderAwsPlugins()
);
