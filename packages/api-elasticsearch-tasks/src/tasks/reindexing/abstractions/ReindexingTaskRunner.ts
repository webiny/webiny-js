import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/settings/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type {
    IElasticsearchIndexingTaskValues,
    IElasticsearchIndexingTaskValuesKeys
} from "~/types.js";

export interface IReindexingTaskRunner {
    exec(
        keys: IElasticsearchIndexingTaskValuesKeys | undefined,
        limit: number,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IElasticsearchIndexingTaskValues>>;
}

export const ReindexingTaskRunner = createAbstraction<IReindexingTaskRunner>(
    "ElasticsearchTasks/ReindexingTaskRunner"
);

export namespace ReindexingTaskRunner {
    export type Interface = IReindexingTaskRunner;
}
