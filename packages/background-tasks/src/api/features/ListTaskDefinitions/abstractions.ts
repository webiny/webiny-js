import { createAbstraction } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IListTaskDefinitionsUseCase {
    execute(): TaskDefinition.Interface[];
}

export const ListTaskDefinitionsUseCase = createAbstraction<IListTaskDefinitionsUseCase>(
    "Tasks/ListTaskDefinitionsUseCase"
);

export namespace ListTaskDefinitionsUseCase {
    export type Interface = IListTaskDefinitionsUseCase;
    export type Return = TaskDefinition.Interface[];
}
