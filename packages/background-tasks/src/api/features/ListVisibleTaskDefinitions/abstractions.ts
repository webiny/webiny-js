import { createAbstraction } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IListVisibleTaskDefinitionsUseCase {
    execute(): TaskDefinition.Interface[];
}

/** List task definitions for the GraphQL API, without the private ones. */
export const ListVisibleTaskDefinitionsUseCase =
    createAbstraction<IListVisibleTaskDefinitionsUseCase>(
        "Tasks/ListVisibleTaskDefinitionsUseCase"
    );

export namespace ListVisibleTaskDefinitionsUseCase {
    export type Interface = IListVisibleTaskDefinitionsUseCase;
}
