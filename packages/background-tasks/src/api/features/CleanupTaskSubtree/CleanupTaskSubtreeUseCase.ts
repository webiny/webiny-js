import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CleanupTaskSubtreeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository, TasksRepository } from "~/api/domain/task/abstractions.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import type { ITask } from "~/api/types.js";
import type { ITaskLog } from "~/api/types.js";
import type { IListTaskParams } from "~/api/types.js";
import type { IListTaskLogParams } from "~/api/types.js";

const PAGE_SIZE = 100;

/**
 * Deletes the task identified by `rootId`, all its descendants, and their logs (when the owning
 * definition has `databaseLogs: true`). Bottom-up and best-effort: a record that fails to delete is
 * logged and skipped, and the use case never throws.
 */
class CleanupTaskSubtreeUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly tasks: TasksRepository.Interface,
        private readonly logs: TaskLogsRepository.Interface,
        private readonly deleteTask: DeleteTaskUseCase.Interface,
        private readonly getDefinition: GetRunnableTaskDefinitionUseCase.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(rootId: string): Promise<void> {
        let ordered: ITask[];
        try {
            ordered = await this.collectSubtree(rootId);
        } catch (error) {
            // Without the full subtree, deleting anything could orphan the tasks we didn't find.
            this.logger.warn(
                { error },
                `cleanupTaskSubtree: failed to collect the subtree of task "${rootId}", skipping.`
            );
            return;
        }
        for (const task of ordered) {
            await this.deleteTaskLogs(task);
            const result = await this.deleteTask.execute(task.id);
            if (result.isFail()) {
                this.logger.warn(
                    { error: result.error },
                    `cleanupTaskSubtree: failed to delete task "${task.id}".`
                );
            }
        }
    }

    // Breadth-first from the root, then reversed, so children are deleted before their parents.
    private async collectSubtree(rootId: string): Promise<ITask[]> {
        const root = await this.tasks.get(rootId);
        if (root.isFail()) {
            return [];
        }
        const order: ITask[] = [root.value];
        const seen = new Set<string>([root.value.id]);
        let i = 0;
        while (i < order.length) {
            const current = order[i++];
            for (const child of await this.listChildren(current.id)) {
                if (seen.has(child.id)) {
                    continue;
                }
                seen.add(child.id);
                order.push(child);
            }
        }
        return order.reverse();
    }

    // Every page, not just the first: a parent can have more children than one page holds.
    private async listChildren(parentId: string): Promise<ITask[]> {
        const children: ITask[] = [];
        let after: string | null = null;
        do {
            const params: IListTaskParams = { where: { parentId }, limit: PAGE_SIZE, after };
            const result = await this.tasks.list(params);
            if (result.isFail()) {
                throw result.error;
            }
            const { items, meta } = result.value;
            children.push(...items);
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);
        return children;
    }

    // All pages are read before anything is deleted, so deleting doesn't shift what a cursor sees.
    private async listLogs(taskId: string): Promise<ITaskLog[]> {
        const logs: ITaskLog[] = [];
        let after: string | null = null;
        do {
            const params: IListTaskLogParams = { where: { task: taskId }, limit: PAGE_SIZE, after };
            const result = await this.logs.list(params);
            if (result.isFail()) {
                throw result.error;
            }
            const { items, meta } = result.value;
            logs.push(...items);
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);
        return logs;
    }

    private async deleteTaskLogs(task: ITask): Promise<void> {
        const definition = this.getDefinition.execute(task.definitionId);
        if (definition.isFail() || definition.value.databaseLogs !== true) {
            return;
        }
        let logs: ITaskLog[];
        try {
            logs = await this.listLogs(task.id);
        } catch (error) {
            this.logger.warn(
                { error },
                `cleanupTaskSubtree: failed to list logs for task "${task.id}".`
            );
            return;
        }
        for (const log of logs) {
            const result = await this.logs.delete(log.id);
            if (result.isFail()) {
                this.logger.warn(
                    { error: result.error },
                    `cleanupTaskSubtree: failed to delete log "${log.id}" for task "${task.id}".`
                );
            }
        }
    }
}

export const CleanupTaskSubtreeUseCase = UseCaseAbstraction.createImplementation({
    implementation: CleanupTaskSubtreeUseCaseImpl,
    dependencies: [
        TasksRepository,
        TaskLogsRepository,
        DeleteTaskUseCase,
        GetRunnableTaskDefinitionUseCase,
        Logger
    ]
});
