import { SQSEvent } from "@webiny/aws-sdk/types";
import { createResolverHandler } from "~/resolver/createResolverHandler.js";
import { createMockSQSEventRecord } from "~tests/mocks/sqsEvent.js";
import { createLambdaContext } from "~tests/mocks/lambdaContext.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createMockLambdaClient } from "~tests/mocks/lambdaClient.js";
import { createMockS3Client } from "~tests/mocks/s3Client.js";

describe("createResolverHandler", () => {
    it("should create a resolver handler and get an error on input because of no deployments", async () => {
        const handler = createResolverHandler({
            awsSyncLambdaArn: "some-arn",
            plugins: [],
            createLambdaClient: () => {
                return createMockLambdaClient();
            },
            createS3Client: () => {
                return createMockS3Client();
            },
            createDocumentClient: params => {
                return getDocumentClient(params);
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
