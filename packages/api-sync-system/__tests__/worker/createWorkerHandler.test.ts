import { describe, expect, it } from "vitest";
import { createWorkerHandler } from "~/index.js";
import {
    CognitoIdentityProvider,
    createCognitoIdentityProviderClient
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { createS3Client, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { mockClient } from "aws-sdk-client-mock";

describe("createWorkerHandler", () => {
    it("should create a worker handler with default plugins", () => {
        mockClient(CognitoIdentityProvider);
        mockClient(S3Client);

        const handler = createWorkerHandler({
            createCognitoIdentityProviderClient,
            createS3Client: createS3Client
        });

        expect(handler).toBeDefined();
        expect(handler).toBeFunction();
    });
});
