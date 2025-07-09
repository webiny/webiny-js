import { createResolverHandler } from "@webiny/api-sync-system";
import { createDocumentClient } from "@webiny/aws-sdk/client-dynamodb/getDocumentClient.js";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createLambdaClient } from "@webiny/aws-sdk/client-lambda/index.js";
import { createCognitoIdentityProviderClient } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";

const debug = process.env.DEBUG === "true";

export const handler = createResolverHandler({
    plugins: [],
    debug,
    awsWorkerLambdaArn: process.env.AWS_SYNC_WORKER_LAMBDA_ARN,
    createS3Client,
    createLambdaClient,
    createDocumentClient,
    createCognitoIdentityProviderClient
});
