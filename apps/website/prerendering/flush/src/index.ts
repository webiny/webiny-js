import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import flushPlugins from "@webiny/api-prerendering-service-aws/flush/flush";
import flushAwsPlugins from "@webiny/api-prerendering-service-aws/flush";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        flushPlugins({
            storageOperations: createPrerenderingServiceStorageOperations({
                table: table => ({
                    ...table,
                    name: String(process.env.DB_TABLE)
                }),
                documentClient
            })
        }),
        flushAwsPlugins()
    ]
});
