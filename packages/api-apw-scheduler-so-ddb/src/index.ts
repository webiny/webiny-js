import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { createTable } from "~/definitions/table";
import { createScheduleActionsEntity } from "~/definitions/scheduleActionEntity";
import { PartitionKeyOptions, CreateStorageOperationsParams } from "~/types";
import {
    ApwScheduleAction,
    ApwScheduleActionStorageOperations,
    StorageOperationsGetScheduleActionParams,
    StorageOperationsListScheduleActionsParams,
    StorageOperationsCreateScheduleActionParams,
    StorageOperationsUpdateScheduleActionParams,
    StorageOperationsDeleteScheduleActionParams,
    StorageOperationsListScheduleActionsResponse,
    StorageOperationsUpdateCurrentTaskParams,
    StorageOperationsDeleteCurrentTaskParams,
    ListWhere
} from "@webiny/api-apw/scheduler/types";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { ApwSchedulerScheduleActionDynamoDbFieldPlugin } from "~/plugins/ApwSchedulerScheduleActionDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createFields } from "~/definitions/fields";
import dynamoDbFilters from "@webiny/db-dynamodb/plugins/filters";

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): ApwScheduleActionStorageOperations => {
    const { table: tableName, documentClient, attributes = {} } = params;

    const plugins = new PluginsContainer([createFields(), dynamoDbFilters()]);

    const table = createTable({ table: tableName, documentClient });

    const entity = createScheduleActionsEntity({
        entityName: "ApwScheduleAction",
        table,
        attributes
    });

    const PK = `APW#SA`;

    function createPartitionKey({ tenant, locale, id }: PartitionKeyOptions): string {
        return `T#${tenant}#L#${locale}#${PK}#${id}`;
    }

    function createCurrentTaskPartitionKey({ tenant, locale }: PartitionKeyOptions): string {
        return `T#${tenant}#L#${locale}#${PK}#CURRENT`;
    }

    function createType(): string {
        return "apw.scheduleAction";
    }

    return {
        async get(
            params: StorageOperationsGetScheduleActionParams
        ): Promise<ApwScheduleAction | null> {
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
                    ex.message || "Could not load schedule action by given parameters.",
                    ex.code || "SCHEDULE_ACTION_GET_ERROR",
                    {
                        where
                    }
                );
            }
        },

        async list(
            params: StorageOperationsListScheduleActionsParams
        ): Promise<StorageOperationsListScheduleActionsResponse> {
            const { limit = 100, sort = [], where: initialWhere } = params;

            const queryAllParams: QueryAllParams = {
                entity: entity,
                partitionKey: PK,
                options: {
                    beginsWith: initialWhere.datetime_startsWith
                        ? initialWhere.datetime_startsWith
                        : "",
                    index: "GSI1",
                    limit: limit || undefined,
                    reverse: sort[0] === "datetime_DESC"
                }
            };

            let results: ApwScheduleAction[] = [];

            try {
                results = await queryAll<ApwScheduleAction>(queryAllParams);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list schedule actions by given parameters.",
                    ex.code || "SCHEDULE_ACTIONS_LIST_ERROR",
                    {
                        partitionKey: queryAllParams.partitionKey,
                        options: queryAllParams.options
                    }
                );
            }

            const where: ListWhere = {
                ...initialWhere
            };
            delete where.datetime_startsWith;

            const apwSchedulerDynamoDbFields =
                plugins.byType<ApwSchedulerScheduleActionDynamoDbFieldPlugin>(
                    ApwSchedulerScheduleActionDynamoDbFieldPlugin.type
                );

            const filteredItems = filterItems({
                plugins,
                items: results,
                where,
                fields: apwSchedulerDynamoDbFields
            });

            return createListResponse({
                items: cleanupItems(entity, filteredItems),
                limit,
                totalCount: filteredItems.length,
                after: null
            });
        },

        async create(
            params: StorageOperationsCreateScheduleActionParams
        ): Promise<ApwScheduleAction> {
            const { item } = params;
            const { tenant, locale, id, data } = item;

            const keys = {
                PK: createPartitionKey({
                    tenant: tenant,
                    locale: locale,
                    id
                }),
                SK: "A",
                GSI1_PK: PK,
                GSI1_SK: data.datetime
            };

            try {
                await entity.put({
                    ...item,
                    TYPE: createType(),
                    ...keys
                });
                return item;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create schedule action item.",
                    ex.code || "SCHEDULE_ACTION_CREATE_ERROR",
                    {
                        keys,
                        params
                    }
                );
            }
        },

        async update(
            params: StorageOperationsUpdateScheduleActionParams
        ): Promise<ApwScheduleAction> {
            const { item } = params;
            const { tenant, locale, id, data } = item;
            const keys = {
                PK: createPartitionKey({
                    tenant: tenant,
                    locale: locale,
                    id: id
                }),
                SK: "A",
                GSI1_PK: PK,
                GSI1_SK: data.datetime
            };

            try {
                await entity.put({
                    ...item,
                    TYPE: createType(),
                    ...keys
                });
                return item;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update schedule action.",
                    ex.code || "SCHEDULE_ACTION__UPDATE_ERROR",
                    {
                        keys,
                        params
                    }
                );
            }
        },

        async delete(params: StorageOperationsDeleteScheduleActionParams): Promise<Boolean> {
            const { tenant, locale, id } = params;
            const keys = {
                PK: createPartitionKey({
                    tenant: tenant,
                    locale: locale,
                    id: id
                }),
                SK: "A"
            };

            try {
                await entity.delete(keys);
                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete schedule action.",
                    ex.code || "SCHEDULE_ACTION__DELETE_ERROR",
                    {
                        keys,
                        params
                    }
                );
            }
        },

        async getCurrentTask(params): Promise<ApwScheduleAction | null> {
            const { where } = params;

            const keys = {
                PK: createCurrentTaskPartitionKey(where),
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
                    ex.message || "Could not load current schedule action by given parameters.",
                    ex.code || "CURRENT_SCHEDULE_ACTION_GET_ERROR",
                    {
                        where
                    }
                );
            }
        },
        async updateCurrentTask(
            params: StorageOperationsUpdateCurrentTaskParams
        ): Promise<ApwScheduleAction> {
            const { item } = params;
            const { tenant, locale } = item;

            const PK = createCurrentTaskPartitionKey({
                tenant: tenant,
                locale: locale
            });
            const keys = {
                PK: PK,
                SK: "A"
            };

            try {
                await entity.update({
                    ...item,
                    TYPE: createType(),
                    ...keys
                });
                return item;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update current schedule action.",
                    ex.code || "CURRENT_SCHEDULE_ACTION__UPDATE_ERROR",
                    {
                        keys,
                        params
                    }
                );
            }
        },
        async deleteCurrentTask(params: StorageOperationsDeleteCurrentTaskParams) {
            const { tenant, locale } = params;
            const keys = {
                PK: createCurrentTaskPartitionKey({
                    tenant: tenant,
                    locale: locale
                }),
                SK: "A"
            };

            try {
                await entity.delete(keys);
                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete current schedule action.",
                    ex.code || "CURRENT_SCHEDULE_ACTION__DELETE_ERROR",
                    {
                        keys,
                        params
                    }
                );
            }
        }
    };
};
