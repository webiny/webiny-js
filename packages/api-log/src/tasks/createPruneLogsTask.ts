import { createTaskDefinition } from "@webiny/tasks";
import type { Context, IPruneLogsInput, IPruneLogsOutput } from "~/tasks/pruneLogs/types";
import { LogType } from "~/types";
import type { NonEmptyArray } from "@webiny/api/types";
import { PRUNE_LOGS_TASK } from "./constants";

export const createPruneLogsTask = () => {
    return createTaskDefinition<Context, IPruneLogsInput, IPruneLogsOutput>({
        id: PRUNE_LOGS_TASK,
        maxIterations: 5,
        disableDatabaseLogs: true,
        isPrivate: false,
        description: "Prune logs from the database, but keep the ones created in last 1 minute.",
        title: "Prune Logs",
        run: async params => {
            const { PruneLogs } = await import(
                /* webpackChunkName: "PruneLogs" */ "./pruneLogs/PruneLogs"
            );

            const { DynamoDbLoggerKeys } = await import(
                /* webpackChunkName: "DynamoDbLoggerKeys" */ "~/logger/dynamodb/DynamoDbLoggerKeys"
            );

            try {
                const prune = new PruneLogs({
                    // @ts-expect-error
                    documentClient: params.context.db.driver.documentClient,
                    keys: new DynamoDbLoggerKeys()
                });
                return await prune.execute({
                    store: params.context.db.store,
                    input: params.input,
                    list: params.context.logger.listLogs,
                    response: params.response,
                    isAborted: params.isAborted,
                    isCloseToTimeout: params.isCloseToTimeout
                });
            } catch (ex) {
                console.log("Error executing the task.", ex);
                return params.response.error({
                    message: ex.message,
                    code: ex.code || "PRUNE_LOGS_TASK_ERROR",
                    data: ex.data
                });
            }
        },
        createInputValidation: ({ validator }) => {
            return {
                tenant: validator.string().optional(),
                source: validator.string().optional(),
                keys: validator.object({}).passthrough().optional(),
                type: validator.enum(Object.keys(LogType) as NonEmptyArray<LogType>).optional(),
                createdAfter: validator
                    .string()
                    .optional()
                    .transform(value => {
                        if (!value) {
                            return undefined;
                        }
                        try {
                            return new Date(value).toISOString();
                        } catch {
                            return undefined;
                        }
                    }),
                items: validator.number().optional()
            };
        }
    });
};
