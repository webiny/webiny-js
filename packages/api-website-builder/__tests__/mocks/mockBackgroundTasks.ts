import { createContextPlugin } from "@webiny/api";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Result } from "@webiny/feature/api";

export const createBackgroundTasks = () => {
    return [
        ...createBackgroundTaskContext(),
        ...createBackgroundTaskGraphQL(),
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
