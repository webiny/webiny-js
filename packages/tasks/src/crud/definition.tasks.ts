import type { Context, ITasksContextDefinitionObject } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetTaskDefinitionUseCase } from "~/features/GetTaskDefinition/index.js";
import { ListTaskDefinitionsUseCase } from "~/features/ListTaskDefinitions/index.js";

export const createDefinitionCrud = (context: Context): ITasksContextDefinitionObject => {
    return {
        getDefinition: <
            I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
            O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
        >(
            id: string
        ) => {
            const useCase = context.container.resolve(GetTaskDefinitionUseCase);
            const result = useCase.execute<I, O>(id);

            if (result.isOk()) {
                return result.value;
            }

            return null;
        },
        listDefinitions: () => {
            const useCase = context.container.resolve(ListTaskDefinitionsUseCase);
            return useCase.execute();
        }
    };
};
