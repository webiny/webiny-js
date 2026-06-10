import type { Context, ITask } from "~/api/types.js";

/**
 * Recursively deletes the task identified by `rootId`, all its descendants, and
 * their logs (when the owning definition has databaseLogs=true). Bottom-up,
 * best-effort: per-record errors are logged and swallowed, the function never
 * throws.
 */
export const createCleanupTaskSubtree = (context: Context) => {
    const listChildren = async (parentId: string): Promise<ITask[]> => {
        const { items } = await context.tasks.listTasks({
            where: { parentId }
        });
        return items;
    };

    const collectSubtree = async (rootId: string): Promise<ITask[]> => {
        const root = await context.tasks.getTask(rootId);
        if (!root) {
            return [];
        }
        const order: ITask[] = [root];
        const seen = new Set<string>([root.id]);
        let i = 0;
        while (i < order.length) {
            const current = order[i++];
            const kids = await listChildren(current.id);
            for (const kid of kids) {
                if (seen.has(kid.id)) {
                    continue;
                }
                seen.add(kid.id);
                order.push(kid);
            }
        }
        return order.reverse();
    };

    const deleteTaskLogs = async (task: ITask): Promise<void> => {
        const definition = context.tasks.getDefinition(task.definitionId);
        if (!definition || definition.databaseLogs !== true) {
            return;
        }
        try {
            const { items } = await context.tasks.listLogs({
                where: { task: task.id }
            });
            for (const log of items) {
                try {
                    await context.tasks.deleteLog(log.id);
                } catch (ex: any) {
                    console.warn(
                        `cleanupTaskSubtree: failed to delete log "${log.id}" for task "${task.id}": ${ex.message}`
                    );
                }
            }
        } catch (ex: any) {
            console.warn(
                `cleanupTaskSubtree: failed to list logs for task "${task.id}": ${ex.message}`
            );
        }
    };

    return async (rootId: string): Promise<void> => {
        const ordered = await collectSubtree(rootId);
        for (const task of ordered) {
            await deleteTaskLogs(task);
            try {
                await context.tasks.deleteTask(task.id);
            } catch (ex: any) {
                console.warn(
                    `cleanupTaskSubtree: failed to delete task "${task.id}": ${ex.message}`
                );
            }
        }
    };
};
