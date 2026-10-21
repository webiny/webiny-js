import { Result } from "@webiny/feature/api";
import { ListVisibleTaskLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTaskLogsUseCase } from "~/api/features/ListTaskLogs/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import type { IListTaskLogParams } from "~/api/types.js";

class ListVisibleTaskLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly listTaskLogs: ListTaskLogsUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly privateDefinitions: PrivateTaskDefinitions.Interface
    ) {}

    public async execute(params: IListTaskLogParams) {
        const privateIds = this.privateDefinitions.getIds();
        if (privateIds.length === 0) {
            return this.listTaskLogs.execute(params);
        }

        // A query for one task: when it is private, or the read fails (missing, or any other
        // failure: fail closed), answer what a missing task answers, an empty list, without
        // querying the logs.
        const requestedTaskId = params?.where?.task;
        if (requestedTaskId) {
            const requestedTask = await this.getTask.execute(requestedTaskId);
            if (requestedTask.isFail() || privateIds.includes(requestedTask.value.definitionId)) {
                return Result.ok({
                    items: [],
                    meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
                });
            }
        }

        // Any other query: drop the logs of private tasks, and of tasks whose read fails (orphans,
        // or a failed read: fail closed; hiding an orphan is harmless), from the page. A log only
        // carries its task id, so the tasks of the page are read once each.
        const result = await this.listTaskLogs.execute(params);
        if (result.isFail()) {
            return result;
        }
        const page = result.value;
        const taskIds = Array.from(new Set(page.items.map(log => log.task)));
        const tasks = await Promise.all(taskIds.map(id => this.getTask.execute(id)));
        const hiddenTaskIds = new Set<string>();
        taskIds.forEach((taskId, index) => {
            const task = tasks[index];
            if (task.isFail() || privateIds.includes(task.value.definitionId)) {
                hiddenTaskIds.add(taskId);
            }
        });
        if (hiddenTaskIds.size === 0) {
            return result;
        }

        const items = page.items.filter(log => !hiddenTaskIds.has(log.task));
        const dropped = page.items.length - items.length;
        return Result.ok({
            items,
            meta: { ...page.meta, totalCount: page.meta.totalCount - dropped }
        });
    }
}

export const ListVisibleTaskLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListVisibleTaskLogsUseCaseImpl,
    dependencies: [ListTaskLogsUseCase, GetTaskUseCase, PrivateTaskDefinitions]
});
