import { ReindexingTaskRunner } from "~/tasks/reindexing/ReindexingTaskRunner";
import { Manager } from "~/tasks/Manager";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import {
    Response,
    ResponseAbortedResult,
    ResponseContinueResult,
    ResponseDoneResult,
    TaskResponse
} from "@webiny/tasks/response";
import { createMockEvent } from "~tests/mocks/event";
import { createTaskManagerStoreMock } from "~tests/mocks/store";
import { createContextMock } from "~tests/mocks/context";
import { createIndexManagerMock } from "~tests/mocks/indexManager";
import { createElasticsearchClientMock } from "~tests/mocks/elasticsearch";

describe("reindexing task runner", () => {
    it("should run a task and receive a continue response", async () => {
        const manager = new Manager({
            context: createContextMock(),
            store: createTaskManagerStoreMock(),
            response: new TaskResponse(new Response(createMockEvent())),
            documentClient: getDocumentClient(),
            elasticsearchClient: {} as any,
            isCloseToTimeout: () => {
                return true;
            },
            isAborted: () => {
                return false;
            }
        });
        const indexManager = createIndexManagerMock();
        const runner = new ReindexingTaskRunner(manager, indexManager);

        const result = await runner.exec(
            {
                PK: "my-pk",
                SK: "my-sk"
            },
            100
        );
        expect(result).toEqual(
            new ResponseContinueResult({
                webinyTaskId: "mockEventId",
                webinyTaskDefinitionId: "mockDefinitionId",
                tenant: "root",
                locale: "en-US",
                input: {
                    keys: {
                        PK: "my-pk",
                        SK: "my-sk"
                    }
                }
            })
        );
    });

    it("should run and receive an abort response", async () => {
        const manager = new Manager({
            context: createContextMock(),
            store: createTaskManagerStoreMock(),
            response: new TaskResponse(new Response(createMockEvent())),
            documentClient: getDocumentClient(),
            elasticsearchClient: createElasticsearchClientMock(),
            isCloseToTimeout: () => {
                return false;
            },
            isAborted: () => {
                return true;
            }
        });
        const indexManager = createIndexManagerMock();
        const runner = new ReindexingTaskRunner(manager, indexManager);

        const result = await runner.exec(
            {
                PK: "my-pk",
                SK: "my-sk"
            },
            100
        );
        expect(result).toEqual(
            new ResponseAbortedResult({
                webinyTaskId: "mockEventId",
                webinyTaskDefinitionId: "mockDefinitionId",
                tenant: "root",
                locale: "en-US"
            })
        );
    });

    it("should run and receive a done response - no items to process", async () => {
        const manager = new Manager({
            context: createContextMock(),
            store: createTaskManagerStoreMock(),
            response: new TaskResponse(new Response(createMockEvent())),
            documentClient: getDocumentClient(),
            elasticsearchClient: createElasticsearchClientMock(),
            isCloseToTimeout: () => {
                return false;
            },
            isAborted: () => {
                return false;
            }
        });
        const indexManager = createIndexManagerMock();
        const runner = new ReindexingTaskRunner(manager, indexManager);

        const result = await runner.exec();

        expect(result).toEqual(
            new ResponseDoneResult({
                message: "No more items to process.",
                webinyTaskId: "mockEventId",
                webinyTaskDefinitionId: "mockDefinitionId",
                tenant: "root",
                locale: "en-US",
                output: {}
            })
        );
    });
});
