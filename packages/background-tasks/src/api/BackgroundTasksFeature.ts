import { createFeature } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { RunnableTaskDecorator } from "./decorators/RunnableTaskDecorator.js";
import { SelfCleaningTaskDecorator } from "./decorators/SelfCleaningTaskDecorator.js";
import { TaskController } from "./features/TaskController/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";
import { createDefinitionCrud } from "./crud/definition.tasks.js";
import { createServiceCrud } from "./crud/service.tasks.js";
import { createTaskCrud } from "./crud/crud.tasks.js";
import { TaskExecutionContextFeature } from "./features/TaskExecutionContext/feature.js";
import { GetTaskDefinitionFeature } from "./features/GetTaskDefinition/feature.js";
import { ListTaskDefinitionsFeature } from "./features/ListTaskDefinitions/feature.js";
import {
    CleanupTaskSubtreeUseCase,
    CleanupTaskSubtreeUseCaseImpl
} from "./features/CleanupTaskSubtree/index.js";
import { TasksCrud } from "./TasksCrud.js";
import { TriggerTaskFeature } from "./features/TriggerTask/feature.js";
import { AbortTaskFeature } from "./features/AbortTask/feature.js";
import { GetTaskFeature } from "./features/GetTask/feature.js";
import { ListTasksFeature } from "./features/ListTasks/feature.js";
import { TestingRunTaskDefinition } from "./tasks/testingRunTask.js";
import { BackgroundTaskPermissionsFeature } from "./features/BackgroundTaskPermissions/feature.js";
import { GetBackgroundTaskSettingsFeature } from "./features/GetBackgroundTaskSettings/feature.js";
import { UpdateBackgroundTaskSettingsFeature } from "./features/UpdateBackgroundTaskSettings/feature.js";
import { BackgroundTasksContextualSchema } from "./graphql/BackgroundTasksContextualSchema.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container) {
        // Register models at register() time so they are available to GetModelUseCase when the
        // ModelsFetcher cache is first filled (which may happen during an earlier feature's enhance).
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);

        // Decorators wrapping all TaskDefinition instances.
        container.registerDecorator(RunnableTaskDecorator);
        container.registerDecorator(SelfCleaningTaskDecorator);

        // Task definition use cases.
        GetTaskDefinitionFeature.register(container);
        ListTaskDefinitionsFeature.register(container);

        // Build the tasks CRUD facade from the container and register it as the canonical TasksCrud
        // abstraction (plus the legacy TaskService alias). The factory methods resolve TasksCrud
        // lazily for sibling calls, so registering the assembled object up front is sufficient.
        const tasksCrud = {
            ...createDefinitionCrud(container),
            ...createTaskCrud(container),
            ...createServiceCrud(container)
        };
        container.registerInstance(TasksCrud, tasksCrud);
        container.registerInstance(TaskService, tasksCrud);

        // Task CRUD use cases (must be after TasksCrud is registered).
        TriggerTaskFeature.register(container);
        AbortTaskFeature.register(container);
        GetTaskFeature.register(container);
        ListTasksFeature.register(container);
        container.registerInstance(
            CleanupTaskSubtreeUseCase,
            new CleanupTaskSubtreeUseCaseImpl(container.resolve(TasksCrud))
        );

        // Execution context (singleton), controller, and the built-in test task.
        TaskExecutionContextFeature.register(container);
        container.register(TaskController);
        container.register(TestingRunTaskDefinition);

        // Permissions + settings features.
        BackgroundTaskPermissionsFeature.register(container);
        GetBackgroundTaskSettingsFeature.register(container);
        UpdateBackgroundTaskSettingsFeature.register(container);

        // GraphQL schema — rendered per-request from the CMS task/log content models.
        container.register(BackgroundTasksContextualSchema);
    }
});
