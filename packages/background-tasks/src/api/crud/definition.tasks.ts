import type { Container } from "@webiny/di";
import type { ITasksContextDefinitionObject } from "~/api/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetTaskDefinitionUseCase } from "~/api/features/GetTaskDefinition/index.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/index.js";

export const createDefinitionCrud = (container: Container): ITasksContextDefinitionObject => {
    return {
        getDefinition: <
            I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
            O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
        >(
            id: string
        ) => {
            const useCase = container.resolve(GetTaskDefinitionUseCase);
            const result = useCase.execute<I, O>(id);

            if (result.isOk()) {
                return result.value;
            }

            return null;
        },
        listDefinitions: () => {
            const useCase = container.resolve(ListTaskDefinitionsUseCase);
            return useCase.execute();
        }
    };
};
