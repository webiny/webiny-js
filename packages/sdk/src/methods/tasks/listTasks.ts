import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";
import type { TaskRun } from "./taskTypes.js";

export async function listTasks(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<TaskRun[], HttpError | ApiError | NetworkError>> {
    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query ListTasks {
            backgroundTasks {
                listTasks {
                    data {
                        id
                        startedOn
                        finishedOn
                        name
                        definitionId
                        iterations
                        parentId
                        executionName
                        eventResponse
                        taskStatus
                        input
                        output
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {});

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.backgroundTasks.listTasks.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.backgroundTasks.listTasks.error.message,
                responseData.backgroundTasks.listTasks.error.code
            )
        );
    }

    return Result.ok(responseData.backgroundTasks.listTasks.data);
}
