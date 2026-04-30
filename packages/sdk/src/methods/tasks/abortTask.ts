import { Result } from "../../Result.js";
import type { TaskRun } from "./taskTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { abortTaskSchema } from "./schemas.js";

export interface AbortTaskParams {
    /** The task run ID to abort. */
    id: string;
    /** Optional reason for aborting the task. */
    message?: string;
}

export const abortTask = createMethod(abortTaskSchema, async (config, fetchFn, { id, message }) => {
    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation AbortTask($id: ID!, $message: String) {
            backgroundTasks {
                abortTask(id: $id, message: $message) {
                    data {
                        id
                        createdOn
                        savedOn
                        startedOn
                        finishedOn
                        definitionId
                        iterations
                        name
                        input
                        output
                        taskStatus
                        executionName
                        eventResponse
                        parentId
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { id, message });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.backgroundTasks.abortTask.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.backgroundTasks.abortTask.error.message,
                responseData.backgroundTasks.abortTask.error.code
            )
        );
    }

    return Result.ok(responseData.backgroundTasks.abortTask.data as TaskRun);
});
