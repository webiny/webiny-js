import { createContextPlugin } from "@webiny/api";
import { createBackgroundTaskContext } from "@webiny/tasks";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export const createBackgroundTasks = () => {
    return [
        ...createBackgroundTaskContext(),
        createContextPlugin(context => {
            context.container.registerInstance(TaskService, {
                trigger() {
                    return {} as any;
                },
                abort() {
                    return {} as any;
                },
                fetchServiceInfo() {
                    return {} as any;
                }
            });
        })
    ];
};
