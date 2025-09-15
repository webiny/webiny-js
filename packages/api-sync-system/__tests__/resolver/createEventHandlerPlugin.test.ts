import { beforeEach, describe, expect, it } from "vitest";
import { createEventHandlerPlugin } from "~/resolver/createEventHandlerPlugin.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { SQSEventHandler } from "@webiny/handler-aws/sqs/index.js";
import { createMockSQSEventRecord } from "~tests/mocks/sqsEvent.js";
import { createMockContext } from "~tests/mocks/context.js";
import { createLambdaContext } from "~tests/mocks/lambdaContext.js";
import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { createMockDeploymentData, storeDeployment } from "~tests/mocks/deployments.js";
import type {
    DynamoDBClientConfig,
    DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { DYNAMODB_REGULAR } from "~tests/mocks/constants.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";

describe("createEventHandlerPlugin", () => {
    const tableName = process.env.DB_TABLE as string;
    const createDocumentClient = (params?: DynamoDBClientConfig) => {
        return getDocumentClient(params);
    };

    let client: DynamoDBDocument;
    beforeEach(() => {
        client = createDocumentClient();
    });

    it("should create handler and fail with error because of missing tableName", async () => {
        const handler = createEventHandlerPlugin({
            tableName: undefined,
            createDocumentClient
        });
        expect(handler).toBeInstanceOf(SQSEventHandler);

        const { context, request, reply } = createMockContext();
        const lambdaContext = createLambdaContext();

        try {
            const result = await handler.cb({
                context,
                reply,
                request,
                lambdaContext,
                next: () => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            return resolve({} as any);
                        }, 100);
                    });
                },
                event: {} as any
            });
            expect(result).toEqual("SHOULD NOT REACH!");
        } catch (ex) {
            expect(ex.message).toEqual("Table name variable is not set.");
        }
    });

    it("should create handler and resolve successfully", async () => {
        const handler = createEventHandlerPlugin({
            tableName,
            createDocumentClient
        });

        await storeDeployment({
            client,
            tableName,
            item: createMockDeploymentData({
                env: "test",
                variant: "green"
            })
        });
        await storeDeployment({
            client,
            tableName,
            item: createMockDeploymentData({
                env: "test",
                variant: "blue"
            })
        });

        const lambdaContext = createLambdaContext();
        const { context, request, reply, getSent } = createMockContext();

        const event: SQSEvent = {
            Records: [
                createMockSQSEventRecord({
                    body: JSON.stringify({
                        version: "1",
                        id: "something",
                        "detail-type": "synchronization-input",
                        source: "webiny:testing",
                        account: "1234",
                        time: "something",
                        region: "eu-central-1",
                        resources: [],
                        detail: {
                            id: generateAlphaNumericId(),
                            items: [
                                {
                                    tableName,
                                    tableType: DYNAMODB_REGULAR,
                                    PK: "pk1",
                                    SK: "sk1",
                                    command: "put"
                                }
                            ],
                            source: createMockSystem({
                                env: "test",
                                variant: "blue"
                            })
                        },
                        eventBusName: "something"
                    })
                })
            ]
        };

        await handler.cb({
            context,
            reply,
            request,
            lambdaContext,
            next: () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        return resolve({} as any);
                    }, 100);
                });
            },
            event
        });

        const sent = getSent();

        expect(sent).toEqual([
            {
                ok: true
            }
        ]);
    });
});
