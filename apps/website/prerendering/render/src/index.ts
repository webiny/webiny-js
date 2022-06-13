import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import renderPlugins from "@webiny/api-prerendering-service-aws/render/sqsRender";
import renderAwsPlugins from "@webiny/api-prerendering-service-aws/render";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    renderPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            table: table => ({
                ...table,
                name: String(process.env.DB_TABLE)
            }),
            documentClient
        })
    }),
    renderAwsPlugins()
);
