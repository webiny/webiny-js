import { createWorkerHandler } from "@webiny/api-sync-system";
import { createS3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createCognitoIdentityProviderClient } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";

const debug = process.env.DEBUG === "true";

export const handler = createWorkerHandler({
    plugins: [],
    debug,
    createS3Client,
    createCognitoIdentityProviderClient
});
