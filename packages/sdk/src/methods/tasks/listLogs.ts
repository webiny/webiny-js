import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import { parseParams } from "../../utils/validateParams.js";
import { listLogsSchema } from "./schemas.js";
import type { TaskLog } from "./taskTypes.js";

export interface ListLogsParams {
    where?: {
        /** Filter logs by task ID. */
        task?: string;
    };
}

export async function listLogs(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: ListLogsParams = {}
): Promise<Result<TaskLog[], HttpError | ApiError | NetworkError | ValidationError>> {
    const parsed = parseParams(listLogsSchema, params);
    if (!parsed.ok) {
        return parsed.result;
    }

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query ListBackgroundTaskLogs($where: BackgroundTaskLogListWhereInput) {
            backgroundTasks {
                listLogs(where: $where) {
                    data {
                        id
                        createdOn
                        executionName
                        iteration
                        items {
                            message
                            createdOn
                            type
                            data
                            error
                        }
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { where: params.where });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.backgroundTasks.listLogs.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.backgroundTasks.listLogs.error.message,
                responseData.backgroundTasks.listLogs.error.code
            )
        );
    }

    return Result.ok(responseData.backgroundTasks.listLogs.data);
}
