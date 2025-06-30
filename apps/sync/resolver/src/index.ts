import { createResolverHandler } from "@webiny/api-sync-system";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/getDocumentClient.js";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createLambdaClient } from "@webiny/aws-sdk/client-lambda/index.js";

const debug = process.env.DEBUG === "true";

export const handler = createResolverHandler({
    plugins: [],
    debug,
    createS3Client: params => {
        return createS3Client(params);
    },
    createLambdaClient: () => {
        return createLambdaClient({
            region: process.env.AWS_REGION
        });
    },
    createDocumentClient: params => {
        return getDocumentClient(params);
    }
});
