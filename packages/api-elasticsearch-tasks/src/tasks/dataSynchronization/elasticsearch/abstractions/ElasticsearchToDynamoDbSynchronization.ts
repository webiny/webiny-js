import { createAbstraction } from "@webiny/feature/api";
import type { IDataSynchronizationInput, ISynchronizationRunResult } from "../../types.js";
import type { IIndexManager } from "~/settings/types.js";

export interface IElasticsearchToDynamoDbSynchronization {
    run(
        input: IDataSynchronizationInput,
        indexManager: IIndexManager
    ): Promise<ISynchronizationRunResult>;
}

export const ElasticsearchToDynamoDbSynchronization =
    createAbstraction<IElasticsearchToDynamoDbSynchronization>(
        "ElasticsearchTasks/ElasticsearchToDynamoDbSynchronization"
    );

export namespace ElasticsearchToDynamoDbSynchronization {
    export type Interface = IElasticsearchToDynamoDbSynchronization;
}
