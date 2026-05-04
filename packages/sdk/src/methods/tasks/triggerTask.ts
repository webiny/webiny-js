import { Result } from "../../Result.js";
import type { TaskRun } from "./taskTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { triggerTaskSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface TriggerTaskParams {
    /** The task definition ID to trigger. */
    definition: string;
    /** Input data to pass to the task. */
    input?: Record<string, unknown>;
}

export const triggerTask = createMethod(
    triggerTaskSchema,
    async (config, fetchFn, { definition, input }) => {
        const query = `
        mutation TriggerTask($definition: WebinyBackgroundTaskDefinitionEnum!, $input: JSON) {
            backgroundTasks {
                triggerTask(definition: $definition, input: $input) {
                    data {
                        id
                        definitionId
                        executionName
                        eventResponse
                        taskStatus
                        input
                        output
                        startedOn
                        finishedOn
                        name
                        iterations
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

        const result = await executeGraphQL(config, fetchFn, query, { definition, input });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.backgroundTasks.triggerTask.error) {
            return Result.fail(
                new ApiError(
                    responseData.backgroundTasks.triggerTask.error.message,
                    responseData.backgroundTasks.triggerTask.error.code
                )
            );
        }

        return Result.ok(responseData.backgroundTasks.triggerTask.data as TaskRun);
    }
);
