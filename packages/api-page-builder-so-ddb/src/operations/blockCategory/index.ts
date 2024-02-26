import WebinyError from "@webiny/error";
import {
    BlockCategory,
    BlockCategoryStorageOperationsCreateParams,
    BlockCategoryStorageOperationsDeleteParams,
    BlockCategoryStorageOperationsGetParams,
    BlockCategoryStorageOperationsListParams,
    BlockCategoryStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { BlockCategoryDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { BlockCategoryDynamoDbFieldPlugin } from "~/plugins/definitions/BlockCategoryDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "~/operations/blockCategory/keys";
import { BlockCategoryStorageOperations } from "~/types";
import { deleteItem, put } from "@webiny/db-dynamodb";

const createType = (): string => {
    return "pb.blockCategory";
};

export interface CreateBlockCategoryStorageOperationsParams {
    entity: Entity;
    plugins: PluginsContainer;
}
export const createBlockCategoryStorageOperations = ({
    entity,
    plugins
}: CreateBlockCategoryStorageOperationsParams): BlockCategoryStorageOperations => {
    const dataLoader = new BlockCategoryDataLoader({
        entity
    });

    const get = async (params: BlockCategoryStorageOperationsGetParams) => {
        const { where } = params;

        try {
            return await dataLoader.getOne(where);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load block category by given parameters.",
                ex.code || "BLOCK_CATEGORY_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const create = async (params: BlockCategoryStorageOperationsCreateParams) => {
        const { blockCategory } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: blockCategory.tenant,
                locale: blockCategory.locale
            }),
            SK: createSortKey(blockCategory)
        };

        try {
            await put({
                entity,
                item: {
                    ...blockCategory,
                    TYPE: createType(),
                    ...keys
                }
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return blockCategory;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create block category.",
                ex.code || "BLOCK_CATEGORY_CREATE_ERROR",
                {
                    keys
                }
            );
        }
    };

    const update = async (params: BlockCategoryStorageOperationsUpdateParams) => {
        const { original, blockCategory } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: original.tenant,
                locale: original.locale
            }),
            SK: createSortKey(blockCategory)
        };

        try {
            await put({
                entity,
                item: {
                    ...blockCategory,
                    TYPE: createType(),
                    ...keys
                }
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return blockCategory;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update block category.",
                ex.code || "BLOCK_CATEGORY_UPDATE_ERROR",
                {
                    keys,
                    original,
                    blockCategory
                }
            );
        }
    };

    const deleteBlockCategory = async (params: BlockCategoryStorageOperationsDeleteParams) => {
        const { blockCategory } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: blockCategory.tenant,
                locale: blockCategory.locale
            }),
            SK: createSortKey(blockCategory)
        };

        try {
            await deleteItem({
                entity,
                keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return blockCategory;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete block category.",
                ex.code || "BLOCK_CATEGORY_DELETE_ERROR",
                {
                    keys,
                    blockCategory
                }
            );
        }
    };

    const list = async (params: BlockCategoryStorageOperationsListParams) => {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({ tenant, locale }),
            options: {
                gt: " "
            }
        };

        let items: BlockCategory[] = [];

        try {
            items = await queryAll<BlockCategory>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list block categories by given parameters.",
                ex.code || "BLOCK_CATEGORIES_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<BlockCategoryDynamoDbFieldPlugin>(
            BlockCategoryDynamoDbFieldPlugin.type
        );

        const filteredItems = filterItems<BlockCategory>({
            plugins,
            where: restWhere,
            items,
            fields
        });

        const sortedItems = sortItems<BlockCategory>({
            items: filteredItems,
            sort,
            fields
        });

        return createListResponse({
            items: sortedItems,
            limit: limit || 100000,
            totalCount: filteredItems.length,
            after: null
        });
    };

    return {
        dataLoader,
        get,
        create,
        update,
        delete: deleteBlockCategory,
        list
    };
};
