import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { createFeature } from "@webiny/feature/api";

class NoopTaskServiceImpl implements ITaskService {
    public readonly triggered: Array<{ definition: string; input: unknown }> = [];
    // When set, the next trigger returns it as a failure and clears it.
    public nextFailure: Error | null = null;

    async trigger(params: any): Promise<Result<any, any>> {
        if (this.nextFailure) {
            const failure = this.nextFailure;
            this.nextFailure = null;
            return Result.fail(failure);
        }
        this.triggered.push({ definition: params.definition, input: params.input });
        return Result.ok({
            id: `task-${this.triggered.length}`,
            name: params.name ?? "",
            definitionId: params.definition,
            executionName: "",
            input: params.input ?? {},
            iterations: 0,
            taskStatus: "pending",
            createdBy: { id: "id-12345678", displayName: "John Doe", type: "admin" },
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            startedOn: undefined,
            finishedOn: undefined,
            eventResponse: {}
        });
    }

    async abort(): Promise<Result<any, any>> {
        return Result.ok({});
    }

    async fetchServiceInfo(): Promise<Result<any, any>> {
        return Result.ok({});
    }
}

export const noopTaskService = new NoopTaskServiceImpl();

export const NoopTaskServiceFeature = createFeature({
    name: "NoopTaskService",
    register(container) {
        container.registerInstance(TaskService, noopTaskService);
    }
});
