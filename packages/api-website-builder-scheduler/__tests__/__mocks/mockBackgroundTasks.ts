import { createContextPlugin } from "@webiny/api";
import { createBackgroundTaskContext } from "@webiny/tasks";
import { TaskService } from "@webiny/api-core/features/TaskService";
import { Result } from "@webiny/feature/api";

export const createMockBackgroundTasks = () => {
    return [
        ...createBackgroundTaskContext(),
        createContextPlugin(context => {
            context.container.registerInstance(TaskService, {
                async trigger() {
                    return Result.ok({}) as any;
                },
                abort() {
                    return Result.ok({}) as any;
                },
                fetchServiceInfo() {
                    return Result.ok({}) as any;
                }
            });
        })
    ];
};
