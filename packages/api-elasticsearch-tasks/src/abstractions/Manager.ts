import type { Client } from "@webiny/api-opensearch";
import type { BatchReadItem } from "@webiny/db-dynamodb/utils/batch/batchRead.js";
import type { IEntity } from "@webiny/db-dynamodb";
import type { DynamoDbDocumentClient } from "@webiny/db-dynamodb/exports/api/db.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IManager {
    readonly openSearchClient: Client;
    readonly table: DynamoDbDocumentClient.Interface;
    readonly controller: TaskController.Interface;
    getEntity(name: string): IEntity;
    read<T>(items: BatchReadItem[]): Promise<T[]>;
}

export const Manager = createAbstraction<IManager>("ElasticsearchTasks/Manager");

export namespace Manager {
    export type Interface = IManager;
}
