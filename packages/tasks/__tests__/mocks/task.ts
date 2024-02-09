import { ITask, TaskDataStatus } from "~/types";
import { createMockIdentity } from "./identity";
import { EventBridgeClientSendResponse } from "@webiny/aws-sdk/client-eventbridge";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";

export const createMockTaskEventResponse = (): EventBridgeClientSendResponse => {
    return {
        $metadata: {
            httpStatusCode: 200,
            requestId: "abc",
            attempts: 1,
            totalRetryDelay: 0
        },
        Entries: [
            {
                EventId: "abcdeft"
            }
        ],
        FailedEntryCount: 0
    };
};

export const createMockTask = (task?: Partial<ITask>): ITask => {
    return {
        id: "myCustomTaskDataId",
        definitionId: MOCK_TASK_DEFINITION_ID,
        input: {},
        name: "A custom task defined via method",
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        taskStatus: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: createMockTaskEventResponse(),
        executionName: "aMockExecutionName",
        iterations: 0,
        ...task
    };
};
