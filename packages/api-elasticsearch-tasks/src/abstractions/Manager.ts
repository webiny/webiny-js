import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Client, createOpenSearchTable } from "@webiny/api-opensearch";
import type { BatchReadItem } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import type { IEntity } from "@webiny/db-dynamodb";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IManager {
    readonly documentClient: DynamoDBDocument;
    readonly openSearchClient: Client;
    readonly table: ReturnType<typeof createOpenSearchTable>;
    readonly controller: TaskController.Interface;
    getEntity(name: string): IEntity;
    read<T>(items: BatchReadItem[]): Promise<T[]>;
}

export const Manager = createAbstraction<IManager>("ElasticsearchTasks/Manager");

export namespace Manager {
    export type Interface = IManager;
}
