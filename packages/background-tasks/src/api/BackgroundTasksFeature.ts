import { createFeature } from "@webiny/feature/api";
import { TaskDefinitionDefaultsDecorator } from "./decorators/TaskDefinitionDefaultsDecorator.js";
import { SelfCleaningTaskHandlerDecorator } from "./decorators/SelfCleaningTaskHandlerDecorator.js";
import { TaskController } from "./features/TaskController/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";
import { TaskModelProvider } from "./domain/task/TaskModelProvider.js";
import { TaskLogModelProvider } from "./domain/task/TaskLogModelProvider.js";
import { TasksRepository } from "./domain/task/TasksRepository.js";
import { TaskLogsRepository } from "./domain/task/TaskLogsRepository.js";
import { TaskExecutionContextFeature } from "./features/TaskExecutionContext/feature.js";
import { TaskHandlerResolverFeature } from "./features/TaskHandlerResolver/feature.js";
import { GetRunnableTaskDefinitionFeature } from "./features/GetRunnableTaskDefinition/feature.js";
import { ListTaskDefinitionsFeature } from "./features/ListTaskDefinitions/feature.js";
import { CleanupTaskSubtreeFeature } from "./features/CleanupTaskSubtree/index.js";
import { CreateTaskFeature } from "./features/CreateTask/index.js";
import { UpdateTaskFeature } from "./features/UpdateTask/index.js";
import { DeleteTaskFeature } from "./features/DeleteTask/index.js";
import { BackgroundTaskServiceFeature } from "./features/TaskService/index.js";
import { CreateTaskLogFeature } from "./features/CreateTaskLog/index.js";
import { UpdateTaskLogFeature } from "./features/UpdateTaskLog/index.js";
import { DeleteTaskLogFeature } from "./features/DeleteTaskLog/index.js";
import { GetLatestTaskLogFeature } from "./features/GetLatestTaskLog/index.js";
import { ListTaskLogsFeature } from "./features/ListTaskLogs/index.js";
import { TriggerTaskFeature } from "./features/TriggerTask/feature.js";
import { AbortTaskFeature } from "./features/AbortTask/feature.js";
import { GetTaskFeature } from "./features/GetTask/feature.js";
import { ListTasksFeature } from "./features/ListTasks/feature.js";
import { TestingRunTaskDefinition } from "./tasks/testingRunTask.js";
import { BackgroundTaskPermissionsFeature } from "./features/BackgroundTaskPermissions/feature.js";
import { GetBackgroundTaskSettingsFeature } from "./features/GetBackgroundTaskSettings/feature.js";
import { UpdateBackgroundTaskSettingsFeature } from "./features/UpdateBackgroundTaskSettings/feature.js";
import { BackgroundTasksGraphQLSchema } from "./graphql/BackgroundTasksGraphQLSchema.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container) {
        // Register models at register() time so they are available to GetModelUseCase when the
        // ModelsFetcher cache is first filled (which may happen during an earlier feature's enhance).
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);

        // Metadata rules, applied to every registered TaskDefinition.
        container.registerDecorator(TaskDefinitionDefaultsDecorator);

        // Self-cleanup runs in the lifecycle hooks, which belong to the handler. Applied when the
        // runner resolves the handler a definition names.
        container.registerDecorator(SelfCleaningTaskHandlerDecorator);

        // Task definition use cases.
        TaskHandlerResolverFeature.register(container);
        GetRunnableTaskDefinitionFeature.register(container);
        ListTaskDefinitionsFeature.register(container);

        // Task and log storage.
        container.register(TaskModelProvider);
        container.register(TaskLogModelProvider);
        container.register(TasksRepository);
        container.register(TaskLogsRepository);

        // Task use cases, and the public TaskService (trigger, abort, service info) on top of them.
        GetTaskFeature.register(container);
        ListTasksFeature.register(container);
        CreateTaskFeature.register(container);
        UpdateTaskFeature.register(container);
        DeleteTaskFeature.register(container);
        CleanupTaskSubtreeFeature.register(container);
        CreateTaskLogFeature.register(container);
        UpdateTaskLogFeature.register(container);
        DeleteTaskLogFeature.register(container);
        GetLatestTaskLogFeature.register(container);
        ListTaskLogsFeature.register(container);
        BackgroundTaskServiceFeature.register(container);
        TriggerTaskFeature.register(container);
        AbortTaskFeature.register(container);

        // Execution context (singleton), controller, and the built-in test task.
        TaskExecutionContextFeature.register(container);
        container.register(TaskController);
        container.register(TestingRunTaskDefinition);

        // Permissions + settings features.
        BackgroundTaskPermissionsFeature.register(container);
        GetBackgroundTaskSettingsFeature.register(container);
        UpdateBackgroundTaskSettingsFeature.register(container);

        // GraphQL schema, rendered from the CMS task/log content models.
        container.register(BackgroundTasksGraphQLSchema);
    }
});
