import {
    ImportExportTask,
    ImportExportTaskStatus,
    ImportExportTaskStorageOperationsCreateParams,
    ImportExportTaskStorageOperationsCreateSubTaskParams,
    ImportExportTaskStorageOperationsDeleteParams,
    ImportExportTaskStorageOperationsGetParams,
    ImportExportTaskStorageOperationsGetSubTaskParams,
    ImportExportTaskStorageOperationsListParams,
    ImportExportTaskStorageOperationsListResponse,
    ImportExportTaskStorageOperationsListSubTaskParams,
    ImportExportTaskStorageOperationsListSubTaskResponse,
    ImportExportTaskStorageOperationsUpdateParams,
    ImportExportTaskStorageOperationsUpdateSubTaskParams,
    ImportExportTaskStorageOperationsUpdateTaskStatsParams
} from "@webiny/api-page-builder-import-export/types";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { createTable } from "~/definitions/table";
import { createPageImportExportTaskEntity } from "~/definitions/pageImportExportTaskEntity";
import { CreateStorageOperations } from "./types";

interface PartitionKeyOptions {
    tenant: string;
    locale: string;
    id?: string;
}

const PARENT_TASK_GSI1_PK = "PB#IE_TASKS";

const createPartitionKey = ({ tenant, locale, id }: PartitionKeyOptions): string => {
    return `T#${tenant}#L#${locale}#PB#IE_TASK#${id}`;
};

const createSortKey = (input: string): string => {
    return `SUB#${input}`;
};

const createGsiPartitionKey = ({ tenant, locale, id }: PartitionKeyOptions): string => {
    return `T#${tenant}#L#${locale}#PB#IE_TASK#${id}`;
};

const createGsiSortKey = (status: ImportExportTaskStatus, id: string): string => {
    return `S#${status}#${id}`;
};

const createType = (): string => {
    return "pb.pageImportExportTask";
};

export const createStorageOperations: CreateStorageOperations = params => {
    const { table: tableName, documentClient, attributes = {} } = params;

    const table = createTable({ table: tableName, documentClient });

    const entity = createPageImportExportTaskEntity({
        entityName: "PageImportExportTask",
        table,
        attributes
    });

    return {
        getTable() {
            return table;
        },
        getEntity() {
            return entity;
        },
        async getTask(
            params: ImportExportTaskStorageOperationsGetParams
        ): Promise<ImportExportTask | null> {
            const { where } = params;

            const keys = {
                PK: createPartitionKey(where),
                SK: "A"
            };

            try {
                const result = await entity.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entity, result.Item);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load page element by given parameters.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_GET_ERROR",
                    {
                        where
                    }
                );
            }
        },

        async listTasks(
            params: ImportExportTaskStorageOperationsListParams
        ): Promise<ImportExportTaskStorageOperationsListResponse> {
            const { limit = 100 } = params;

            const queryAllParams: QueryAllParams = {
                entity: entity,
                partitionKey: PARENT_TASK_GSI1_PK,
                options: {
                    beginsWith: "",
                    index: "GSI1",
                    limit: limit || undefined
                }
            };

            let results: ImportExportTask[] = [];

            try {
                results = await queryAll<ImportExportTask>(queryAllParams);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list page import export tasks by given parameters.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASKS_LIST_ERROR",
                    {
                        partitionKey: queryAllParams.partitionKey,
                        options: queryAllParams.options
                    }
                );
            }

            const items = results.map(item =>
                cleanupItem<ImportExportTask>(entity, item)
            ) as ImportExportTask[];

            // TODO: Implement sort and filter

            return createListResponse({
                items: items,
                limit,
                totalCount: items.length,
                after: null
            });
        },

        async createTask(
            params: ImportExportTaskStorageOperationsCreateParams
        ): Promise<ImportExportTask> {
            const { task } = params;

            const keys = {
                PK: createPartitionKey({
                    tenant: task.tenant,
                    locale: task.locale,
                    id: task.id
                }),
                SK: "A",
                GSI1_PK: PARENT_TASK_GSI1_PK,
                GSI1_SK: task.createdOn
            };

            try {
                await entity.put({
                    ...task,
                    TYPE: createType(),
                    ...keys
                });
                return task;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create pageImportExportTask.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_CREATE_ERROR",
                    {
                        keys,
                        pageImportExportTask: task
                    }
                );
            }
        },

        async updateTask(
            params: ImportExportTaskStorageOperationsUpdateParams
        ): Promise<ImportExportTask> {
            const { task, original } = params;
            const keys = {
                PK: createPartitionKey({
                    tenant: task.tenant,
                    locale: task.locale,
                    id: task.id
                }),
                SK: "A",
                GSI1_PK: PARENT_TASK_GSI1_PK,
                GSI1_SK: task.createdOn
            };

            try {
                await entity.put({
                    ...task,
                    TYPE: createType(),
                    ...keys
                });
                return task;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update pageImportExportTask.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_UPDATE_ERROR",
                    {
                        keys,
                        original,
                        task: task
                    }
                );
            }
        },

        async deleteTask(
            params: ImportExportTaskStorageOperationsDeleteParams
        ): Promise<ImportExportTask> {
            const { task } = params;
            const keys = {
                PK: createPartitionKey({
                    tenant: task.tenant,
                    locale: task.locale,
                    id: task.id
                }),
                SK: "A"
            };

            try {
                await entity.delete(keys);
                return task;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete pageImportExportTask.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_DELETE_ERROR",
                    {
                        keys,
                        task: task
                    }
                );
            }
        },

        async updateTaskStats(
            params: ImportExportTaskStorageOperationsUpdateTaskStatsParams
        ): Promise<ImportExportTask> {
            const {
                original,
                input: { prevStatus, nextStatus }
            } = params;

            const keys = {
                PK: createPartitionKey({
                    tenant: original.tenant,
                    locale: original.locale,
                    id: original.id
                }),
                SK: "A",
                GSI1_PK: PARENT_TASK_GSI1_PK,
                GSI1_SK: original.createdOn
            };

            try {
                await entity.update({
                    TYPE: createType(),
                    ...keys,
                    stats: {
                        $set: {
                            [prevStatus]: { $add: -1 },
                            [nextStatus]: { $add: 1 }
                        }
                    }
                });
                return original;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update pageImportExportTask.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_UPDATE_ERROR",
                    {
                        keys,
                        original
                    }
                );
            }
        },

        async createSubTask(
            params: ImportExportTaskStorageOperationsCreateSubTaskParams
        ): Promise<ImportExportTask> {
            const { subTask } = params;
            const pkParams = {
                tenant: subTask.tenant,
                locale: subTask.locale,
                id: subTask.parent
            };
            const keys = {
                PK: createPartitionKey(pkParams),
                SK: createSortKey(subTask.id),
                GSI1_PK: createGsiPartitionKey(pkParams),
                GSI1_SK: createGsiSortKey(subTask.status, subTask.id)
            };

            try {
                await entity.put({
                    ...subTask,
                    TYPE: createType(),
                    ...keys
                });
                return subTask;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create pageImportExportSubTask.",
                    ex.code || "CREATE_PAGE_IMPORT_EXPORT_SUB_TASK_ERROR",
                    {
                        keys,
                        subTask: subTask
                    }
                );
            }
        },

        async updateSubTask(
            params: ImportExportTaskStorageOperationsUpdateSubTaskParams
        ): Promise<ImportExportTask> {
            const { subTask, original } = params;
            const pkParams = {
                tenant: subTask.tenant,
                locale: subTask.locale,
                id: subTask.parent
            };
            const keys = {
                PK: createPartitionKey(pkParams),
                SK: createSortKey(subTask.id),
                GSI1_PK: createGsiPartitionKey(pkParams),
                GSI1_SK: createGsiSortKey(subTask.status, subTask.id)
            };

            try {
                await entity.put({
                    ...subTask,
                    TYPE: createType(),
                    ...keys
                });
                return subTask;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update pageImportExportSubTask.",
                    ex.code || "UPDATE_PAGE_IMPORT_EXPORT_SUB_TASK_ERROR",
                    {
                        keys,
                        original,
                        subTask: subTask
                    }
                );
            }
        },

        async getSubTask(
            params: ImportExportTaskStorageOperationsGetSubTaskParams
        ): Promise<ImportExportTask | null> {
            const { where } = params;

            const keys = {
                PK: createPartitionKey({
                    tenant: where.tenant,
                    locale: where.locale,
                    id: where.parent
                }),
                SK: createSortKey(where.id)
            };
            try {
                const result = await entity.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entity, result.Item);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load page import export subTask by given parameters.",
                    ex.code || "PAGE_IMPORT_EXPORT_TASK_GET_ERROR",
                    {
                        where
                    }
                );
            }
        },

        async listSubTasks(
            params: ImportExportTaskStorageOperationsListSubTaskParams
        ): Promise<ImportExportTaskStorageOperationsListSubTaskResponse> {
            const { where, limit = 100 } = params;

            const { tenant, locale, parent, status } = where;
            const queryAllParams: QueryAllParams = {
                entity: entity,
                partitionKey: createGsiPartitionKey({
                    tenant,
                    locale,
                    id: parent
                }),
                options: {
                    beginsWith: `S#${status}`,
                    limit: limit || undefined,
                    index: "GSI1"
                }
            };

            let results: ImportExportTask[] = [];

            try {
                results = await queryAll<ImportExportTask>(queryAllParams);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list page import export tasks by given parameters.",
                    ex.code || "LIST_PAGE_IMPORT_EXPORT_SUB_TASKS_ERROR",
                    {
                        partitionKey: queryAllParams.partitionKey,
                        options: queryAllParams.options
                    }
                );
            }

            const items = results.map(item =>
                cleanupItem<ImportExportTask>(entity, item)
            ) as ImportExportTask[];

            return createListResponse({
                items: items,
                limit,
                totalCount: items.length,
                after: null
            });
        }
    };
};
