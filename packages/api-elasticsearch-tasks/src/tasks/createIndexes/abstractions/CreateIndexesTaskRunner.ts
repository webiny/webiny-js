import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/settings/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ICreateIndexesTaskRunner {
    execute(
        matching: string | undefined,
        done: string[],
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result>;
}

export const CreateIndexesTaskRunner = createAbstraction<ICreateIndexesTaskRunner>(
    "ElasticsearchTasks/CreateIndexesTaskRunner"
);

export namespace CreateIndexesTaskRunner {
    export type Interface = ICreateIndexesTaskRunner;
}
