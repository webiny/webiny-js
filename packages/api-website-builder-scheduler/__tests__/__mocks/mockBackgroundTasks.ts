import type { Container } from "@webiny/di";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Result } from "@webiny/feature/api";

/**
 * Registers background tasks DI-natively, then overrides TaskService with a no-op mock so tests
 * don't dispatch real tasks. Call inside the `features` callback of the test handler.
 */
export const registerMockBackgroundTasks = (container: Container) => {
    BackgroundTasksFeature.register(container);
    container.registerInstance(TaskService, {
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
};
