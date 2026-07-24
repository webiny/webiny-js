import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IEnableIndexingInput {
    matching?: string;
    numberOfReplicas?: number;
    refreshInterval?: string;
}

export interface IEnableIndexingRunner {
    exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IEnableIndexingInput>>;
}

export const EnableIndexingRunner = createAbstraction<IEnableIndexingRunner>(
    "SearchIndexTasks/EnableIndexingRunner"
);

export namespace EnableIndexingRunner {
    export type Interface = IEnableIndexingRunner;
    export type Input = IEnableIndexingInput;
}
