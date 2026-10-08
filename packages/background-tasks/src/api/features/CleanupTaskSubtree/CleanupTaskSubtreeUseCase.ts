import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CleanupTaskSubtreeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository, TasksRepository } from "~/api/domain/task/abstractions.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import type { ITask } from "~/api/types.js";

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

    private async listChildren(parentId: string): Promise<ITask[]> {
        const result = await this.tasks.list({ where: { parentId } });
        if (result.isFail()) {
            throw result.error;
        }
        return result.value.items;
    }

    private async deleteTaskLogs(task: ITask): Promise<void> {
        const definition = this.getDefinition.execute(task.definitionId);
        if (definition.isFail() || definition.value.databaseLogs !== true) {
            return;
        }
        const logs = await this.logs.list({ where: { task: task.id } });
        if (logs.isFail()) {
            this.logger.warn(
                { error: logs.error },
                `cleanupTaskSubtree: failed to list logs for task "${task.id}".`
            );
            return;
        }
        for (const log of logs.value.items) {
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
