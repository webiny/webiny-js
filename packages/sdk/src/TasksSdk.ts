import type { WebinyConfig } from "./types.js";
import type { HttpError, GraphQLError, NetworkError } from "./errors.js";
import type { Result } from "./Result.js";
import type { TaskDefinition, TaskRun, TaskLog } from "./methods/tasks/taskTypes.js";
import type { ListLogsParams } from "./methods/tasks/listLogs.js";
import type { TriggerTaskParams } from "./methods/tasks/triggerTask.js";
import type { AbortTaskParams } from "./methods/tasks/abortTask.js";
import { listDefinitions as listDefinitionsFn } from "./methods/tasks/listDefinitions.js";
import { listTasks as listTasksFn } from "./methods/tasks/listTasks.js";
import { listLogs as listLogsFn } from "./methods/tasks/listLogs.js";
import { triggerTask as triggerTaskFn } from "./methods/tasks/triggerTask.js";
import { abortTask as abortTaskFn } from "./methods/tasks/abortTask.js";

export class TasksSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async listDefinitions(): Promise<
        Result<TaskDefinition[], HttpError | GraphQLError | NetworkError>
    > {
        return listDefinitionsFn(this.config, this.fetchFn);
    }

    async listTasks(): Promise<Result<TaskRun[], HttpError | GraphQLError | NetworkError>> {
        return listTasksFn(this.config, this.fetchFn);
    }

    async listLogs(
        params?: ListLogsParams
    ): Promise<Result<TaskLog[], HttpError | GraphQLError | NetworkError>> {
        return listLogsFn(this.config, this.fetchFn, params);
    }

    async triggerTask(
        params: TriggerTaskParams
    ): Promise<Result<TaskRun, HttpError | GraphQLError | NetworkError>> {
        return triggerTaskFn(this.config, this.fetchFn, params);
    }

    async abortTask(
        params: AbortTaskParams
    ): Promise<Result<TaskRun, HttpError | GraphQLError | NetworkError>> {
        return abortTaskFn(this.config, this.fetchFn, params);
    }
}
