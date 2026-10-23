import { Result } from "@webiny/feature/api";
import { ListVisibleTaskLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTaskLogsUseCase } from "~/api/features/ListTaskLogs/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import { createRevisionId } from "~/api/domain/task/createRevisionId.js";
import type { IListTaskLogParams } from "~/api/types.js";

class ListVisibleTaskLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly listTaskLogs: ListTaskLogsUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly listTasks: ListTasksUseCase.Interface,
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

        // Any other query: drop the logs of private tasks, and of tasks that no longer exist
        // (orphans; hiding one is harmless), from the page. A log only carries its task id, so the
        // tasks of the page are read in one query. A failed read fails the list: fail closed.
        const result = await this.listTaskLogs.execute(params);
        if (result.isFail()) {
            return result;
        }
        const page = result.value;
        const taskIds = Array.from(new Set(page.items.map(log => log.task)));
        if (taskIds.length === 0) {
            return result;
        }
        const tasksResult = await this.listTasks.execute({
            where: { id_in: taskIds.map(createRevisionId) },
            limit: taskIds.length
        });
        if (tasksResult.isFail()) {
            return Result.fail(tasksResult.error);
        }
        const visibleTaskIds = new Set(
            tasksResult.value.items
                .filter(task => !privateIds.includes(task.definitionId))
                .map(task => task.id)
        );
        const items = page.items.filter(log => visibleTaskIds.has(log.task));
        if (items.length === page.items.length) {
            return result;
        }

        const dropped = page.items.length - items.length;
        return Result.ok({
            items,
            meta: { ...page.meta, totalCount: page.meta.totalCount - dropped }
        });
    }
}

export const ListVisibleTaskLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListVisibleTaskLogsUseCaseImpl,
    dependencies: [ListTaskLogsUseCase, GetTaskUseCase, ListTasksUseCase, PrivateTaskDefinitions]
});
