import { describe, expect, it } from "vitest";
import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { createResolverHandler } from "~/resolver/createResolverHandler.js";
import { createMockSQSEventRecord } from "~tests/mocks/sqsEvent.js";
import { createLambdaContext } from "~tests/mocks/lambdaContext.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { createLambdaClient, LambdaClient } from "@webiny/aws-sdk/client-lambda/index.js";
import { createS3Client, S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createCognitoIdentityProviderClient } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";

describe("createResolverHandler", () => {
    it("should create a resolver handler and get an error on input because of no deployments", async () => {
        const mockedLambdaClient = mockClient(LambdaClient);
        mockedLambdaClient.onAnyCommand().resolves({
            StatusCode: 200
        });
        const mockedS3Client = mockClient(S3Client);
        mockedS3Client.onAnyCommand().resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const handler = createResolverHandler({
            awsWorkerLambdaArn: "some-arn",
            plugins: [],
            createLambdaClient: () => {
                return createLambdaClient();
            },
            createS3Client: () => {
                return createS3Client();
            },
            createDocumentClient: params => {
                return getDocumentClient(params);
            },
            createCognitoIdentityProviderClient(config) {
                return createCognitoIdentityProviderClient(config);
            }
        });

        const event: SQSEvent = {
            Records: [createMockSQSEventRecord()]
        };

        const result = await handler(event, createLambdaContext());

        expect(result).toEqual({
            body: expect.any(String),
            headers: {
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "POST",
                "access-control-allow-origin": "*",
                "cache-control": "no-store",
                connection: "keep-alive",
                "content-length": expect.stringMatching(/^([0-9]+)$/),
                "content-type": "application/json; charset=utf-8",
                date: expect.toBeDateString()
            },
            isBase64Encoded: false,
            statusCode: 200
        });

        expect(JSON.parse(result.body)).toMatchObject({
            error: {
                message: "No deployments found which need to be synced.",
                code: "NO_DEPLOYMENTS",
                data: {
                    table: process.env.DB_TABLE
                }
            }
        });
    });
});
