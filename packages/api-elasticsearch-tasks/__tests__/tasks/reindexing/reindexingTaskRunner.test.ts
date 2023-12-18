import { ReindexingTaskRunner } from "~/tasks/reindexing/ReindexingTaskRunner";
import { Manager } from "~/tasks/Manager";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { Response, ResponseContinueResult, TaskResponse } from "@webiny/tasks/response";
import { createMockEvent } from "~tests/mocks/event";
import { createTaskManagerStoreMock } from "~tests/mocks/store";
import { createContextMock } from "~tests/mocks/context";

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
            isStopped: () => {
                return false;
            }
        });
        const runner = new ReindexingTaskRunner(manager, {
            PK: "my-pk",
            SK: "my-sk"
        });

        const result = await runner.exec(100);
        expect(result).toEqual(
            new ResponseContinueResult({
                webinyTaskId: "mockEventId",
                tenant: "root",
                locale: "en-US",
                values: {
                    keys: {
                        PK: "my-pk",
                        SK: "my-sk"
                    }
                }
            })
        );
    });
});
