import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ICreateIndexesInput {
    matching?: string;
    done?: string[];
}

export interface ICreateIndexesRunner {
    execute(
        matching: string | undefined,
        done: string[],
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result>;
}

export const CreateIndexesRunner = createAbstraction<ICreateIndexesRunner>(
    "SearchIndexTasks/CreateIndexesRunner"
);

export namespace CreateIndexesRunner {
    export type Interface = ICreateIndexesRunner;
    export type Input = ICreateIndexesInput;
}
