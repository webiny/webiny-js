import { ITaskData, TaskDataStatus } from "~/types";
import { createMockIdentity } from "./identity";
import { EventBridgeClientSendResponse } from "@webiny/aws-sdk/client-eventbridge";

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

export const createMockTask = (task?: Partial<ITaskData>): ITaskData => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        values: {},
        name: "A custom task defined via method",
        log: [],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        status: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: createMockTaskEventResponse(),
        ...task
    };
};
