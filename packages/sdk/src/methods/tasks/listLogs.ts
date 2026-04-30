import { Result } from "../../Result.js";
import type { TaskLog } from "./taskTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listLogsSchema } from "./schemas.js";

export interface ListLogsParams {
    where?: {
        /** Filter logs by task ID. */
        task?: string;
    };
}

export const listLogs = createMethod(listLogsSchema, async (config, fetchFn, { where }) => {
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

    const result = await executeGraphQL(config, fetchFn, query, { where });

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

    return Result.ok(responseData.backgroundTasks.listLogs.data as TaskLog[]);
});
