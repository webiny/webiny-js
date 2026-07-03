import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/settings/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchEnableIndexingTaskInput } from "../types.js";

export interface IEnableIndexingTaskRunner {
    exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IElasticsearchEnableIndexingTaskInput>>;
}

export const EnableIndexingTaskRunner = createAbstraction<IEnableIndexingTaskRunner>(
    "ElasticsearchTasks/EnableIndexingTaskRunner"
);

export namespace EnableIndexingTaskRunner {
    export type Interface = IEnableIndexingTaskRunner;
}
