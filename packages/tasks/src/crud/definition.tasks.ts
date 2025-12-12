import type { Context, ITasksContextDefinitionObject } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export const createDefinitionCrud = (context: Context): ITasksContextDefinitionObject => {
    return {
        getDefinition: <
            I extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput,
            O extends TaskDefinition.TaskDoneOutput = TaskDefinition.TaskDoneOutput
        >(
            id: string
        ) => {
            // Resolve all TaskDefinition implementations from DI container
            const definitions = context.container.resolveAll(TaskDefinition);

            for (const definition of definitions) {
                if (definition.id === id) {
                    return definition as TaskDefinition.Runnable<I, O>;
                }
            }
            return null;
        },
        listDefinitions: () => {
            // Resolve all TaskDefinition implementations from DI container
            return context.container.resolveAll(TaskDefinition);
        }
    };
};
