import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import { parseParams } from "../../utils/validateParams.js";
import { triggerTaskSchema } from "./schemas.js";
import type { TaskRun } from "./taskTypes.js";

export interface TriggerTaskParams {
    /** The task definition ID to trigger. */
    definition: string;
    /** Input data to pass to the task. */
    input?: Record<string, unknown>;
}

export async function triggerTask(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: TriggerTaskParams
): Promise<Result<TaskRun, HttpError | ApiError | NetworkError | ValidationError>> {
    const parsed = parseParams(triggerTaskSchema, params);
    if (!parsed.ok) return parsed.result;
    const { definition, input } = parsed.data;

    const { executeGraphQL } = await import("../executeGraphQL.js");

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
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.backgroundTasks.triggerTask.error.message,
                responseData.backgroundTasks.triggerTask.error.code
            )
        );
    }

    return Result.ok(responseData.backgroundTasks.triggerTask.data);
}
