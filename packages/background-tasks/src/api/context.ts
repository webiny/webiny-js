import type { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { RunnableTaskDecorator } from "./decorators/RunnableTaskDecorator.js";
import { SelfCleaningTaskDecorator } from "./decorators/SelfCleaningTaskDecorator.js";
import { TaskController } from "./features/TaskController/index.js";
import type { Context } from "~/api/types.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { createDefinitionCrud } from "./crud/definition.tasks.js";
import { createServiceCrud } from "~/api/crud/service.tasks.js";
import { createTaskCrud } from "./crud/crud.tasks.js";
import { createServicePlugins } from "~/api/service/index.js";
import { TaskExecutionContextFeature } from "~/api/features/TaskExecutionContext/feature.js";
import { GetTaskDefinitionFeature } from "~/api/features/GetTaskDefinition/feature.js";
import { ListTaskDefinitionsFeature } from "~/api/features/ListTaskDefinitions/feature.js";
import {
    CleanupTaskSubtreeUseCase,
    CleanupTaskSubtreeUseCaseImpl
} from "~/api/features/CleanupTaskSubtree/index.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { TriggerTaskFeature } from "~/api/features/TriggerTask/feature.js";
import { AbortTaskFeature } from "~/api/features/AbortTask/feature.js";
import { GetTaskFeature } from "~/api/features/GetTask/feature.js";
import { ListTasksFeature } from "~/api/features/ListTasks/feature.js";
import { TestingRunTaskDefinition } from "~/api/tasks/testingRunTask.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { BackgroundTaskSettingsModel } from "~/api/models/BackgroundTaskSettingsModel.js";
import { GetBackgroundTaskSettingsFeature } from "~/api/features/GetBackgroundTaskSettings/feature.js";
import { UpdateBackgroundTaskSettingsFeature } from "~/api/features/UpdateBackgroundTaskSettings/feature.js";
import { BackgroundTaskPermissionsFeature } from "~/api/features/BackgroundTaskPermissions/feature.js";
import { createBackgroundTaskSettingsGraphQL } from "~/api/graphql/BackgroundTaskSettingsSchema.js";

const createTasksCrud = () => {
    const tasksCrudPlugin = new ContextPlugin<Context>(async context => {
        // Register the RunnableTaskDecorator to wrap all TaskDefinition instances
        context.container.registerDecorator(RunnableTaskDecorator);
        context.container.registerDecorator(SelfCleaningTaskDecorator);

        // Register task definition use cases
        GetTaskDefinitionFeature.register(context.container);
        ListTaskDefinitionsFeature.register(context.container);

        context.tasks = {
            ...createDefinitionCrud(context),
            ...createTaskCrud(context),
            ...createServiceCrud(context)
        };

        // Register the full CRUD object as a DI abstraction for use cases that need it.
        context.container.registerInstance(TasksCrud, context.tasks);

        // Register task CRUD use cases (must be after TasksCrud is registered).
        TriggerTaskFeature.register(context.container);
        AbortTaskFeature.register(context.container);
        GetTaskFeature.register(context.container);
        ListTasksFeature.register(context.container);
        context.container.registerInstance(
            CleanupTaskSubtreeUseCase,
            new CleanupTaskSubtreeUseCaseImpl(context.container.resolve(TasksCrud))
        );
    });

    tasksCrudPlugin.name = "tasks.context";

    return tasksCrudPlugin;
};

const createTasksContext = (): Plugin[] => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(TaskPrivateModel);
        context.container.register(TaskLogPrivateModel);
        context.container.register(BackgroundTaskSettingsModel);
    });

    return [...createServicePlugins(), createTasksCrud(), modelsPlugin];
};

export const createBackgroundTaskContext = (): Plugin[] => {
    return [
        ...createTasksContext(),
        ...createBackgroundTaskSettingsGraphQL(),
        new ContextPlugin<Context>(context => {
            // Register legacy tasks context via a new abstraction
            context.container.registerInstance(TaskService, context.tasks);

            // Register TaskExecutionContext EARLY (singleton, empty)
            TaskExecutionContextFeature.register(context.container);

            // Register TaskController (depends on TaskExecutionContext)
            context.container.register(TaskController);

            // Register a test task
            context.container.register(TestingRunTaskDefinition);

            // Permissions.
            BackgroundTaskPermissionsFeature.register(context.container);

            // Settings features.
            GetBackgroundTaskSettingsFeature.register(context.container);
            UpdateBackgroundTaskSettingsFeature.register(context.container);
        })
    ];
};
