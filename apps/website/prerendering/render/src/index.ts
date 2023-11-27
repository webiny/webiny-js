import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import renderPlugins from "@webiny/api-prerendering-service-aws/render/sqsRender";
import renderAwsPlugins from "@webiny/api-prerendering-service-aws/render";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
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
    ]
});
