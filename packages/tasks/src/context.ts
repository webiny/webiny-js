import type { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { RunnableTaskDecorator } from "./decorators/RunnableTaskDecorator.js";
import { SelfCleaningTaskDecorator } from "./decorators/SelfCleaningTaskDecorator.js";
import { TaskController } from "./features/TaskController/index.js";
import type { Context } from "~/types.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { createDefinitionCrud } from "./crud/definition.tasks.js";
import { createServiceCrud } from "~/crud/service.tasks.js";
import { createTaskCrud } from "./crud/crud.tasks.js";
import { createServicePlugins } from "~/service/index.js";
import { TaskExecutionContextFeature } from "~/features/TaskExecutionContext/feature.js";
import { GetTaskDefinitionFeature } from "~/features/GetTaskDefinition/feature.js";
import { ListTaskDefinitionsFeature } from "~/features/ListTaskDefinitions/feature.js";
import {
    CleanupTaskSubtreeUseCase,
    CleanupTaskSubtreeUseCaseImpl
} from "~/features/CleanupTaskSubtree/index.js";
import { TestingRunTaskDefinition } from "~/tasks/testingRunTask.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

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

        // The cleanup use case is a thin wrapper around `context.tasks.cleanupTaskSubtree`,
        // so it must register AFTER the CRUD is wired onto the context.
        context.container.registerInstance(
            CleanupTaskSubtreeUseCase,
            new CleanupTaskSubtreeUseCaseImpl(context)
        );
    });

    tasksCrudPlugin.name = "tasks.context";

    return tasksCrudPlugin;
};

const createTasksContext = (): Plugin[] => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(TaskPrivateModel);
        context.container.register(TaskLogPrivateModel);
    });

    return [...createServicePlugins(), createTasksCrud(), modelsPlugin];
};

export const createBackgroundTaskContext = (): Plugin[] => {
    return [
        ...createTasksContext(),
        new ContextPlugin<Context>(context => {
            // Register legacy tasks context via a new abstraction
            context.container.registerInstance(TaskService, context.tasks);

            // Register TaskExecutionContext EARLY (singleton, empty)
            TaskExecutionContextFeature.register(context.container);

            // Register TaskController (depends on TaskExecutionContext)
            context.container.register(TaskController);

            // Register a test task
            context.container.register(TestingRunTaskDefinition);
        })
    ];
};
