import type { Container } from "@webiny/di";
import type { ITask } from "~/api/types.js";
import { TasksCrud } from "~/api/TasksCrud.js";

/**
 * Recursively deletes the task identified by `rootId`, all its descendants, and
 * their logs. The logs are listed by task id whatever the owning definition says
 * (`databaseLogs`, or no registered definition): a self-cleaning task writes none
 * of its own, but an abort still writes one log row, and cleanup removes whatever
 * exists. Bottom-up, best-effort: per-record errors are logged and swallowed, the
 * function never throws.
 */
export const createCleanupTaskSubtree = (container: Container) => {
    const listChildren = async (parentId: string): Promise<ITask[]> => {
        const { items } = await container.resolve(TasksCrud).listTasks({
            where: { parentId }
        });
        return items;
    };

    const collectSubtree = async (rootId: string): Promise<ITask[]> => {
        const root = await container.resolve(TasksCrud).getTask(rootId);
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
        try {
            // Page through every log: list the first page (no cursor), delete its rows, and list
            // again while the listed page was non-empty and more remain (deleted rows shift the
            // pages, so the cursor is never used). An empty page ends the loop; so does a page
            // in which no delete succeeded (it would come back unchanged and spin forever).
            let hasMore = true;
            while (hasMore) {
                const { items, meta } = await container.resolve(TasksCrud).listLogs({
                    where: { task: task.id }
                });
                let deleted = 0;
                for (const log of items) {
                    try {
                        await container.resolve(TasksCrud).deleteLog(log.id);
                        deleted++;
                    } catch (ex: any) {
                        console.warn(
                            `cleanupTaskSubtree: failed to delete log "${log.id}" for task "${task.id}": ${ex.message}`
                        );
                    }
                }
                hasMore = items.length > 0 && deleted > 0 && meta.hasMoreItems;
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
                await container.resolve(TasksCrud).deleteTask(task.id);
            } catch (ex: any) {
                console.warn(
                    `cleanupTaskSubtree: failed to delete task "${task.id}": ${ex.message}`
                );
            }
        }
    };
};
