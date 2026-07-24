import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager, IIndexSettingsMap } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IReindexInput {
    matching?: string;
    limit?: number;
    cursor?: string;
    settings?: IIndexSettingsMap;
}

export interface IReindexRunner {
    exec(
        cursor: string | undefined,
        limit: number,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IReindexInput>>;
}

export const ReindexRunner = createAbstraction<IReindexRunner>("SearchIndexTasks/ReindexRunner");

export namespace ReindexRunner {
    export type Interface = IReindexRunner;
    export type Input = IReindexInput;
}
