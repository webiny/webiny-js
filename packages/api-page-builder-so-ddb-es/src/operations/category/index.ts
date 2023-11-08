import WebinyError from "@webiny/error";
import {
    Category,
    CategoryStorageOperationsCreateParams,
    CategoryStorageOperationsDeleteParams,
    CategoryStorageOperationsGetParams,
    CategoryStorageOperationsListParams,
    CategoryStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { CategoryDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { CategoryDynamoDbElasticFieldPlugin } from "~/plugins/definitions/CategoryDynamoDbElasticFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "~/operations/category/keys";
import { CategoryStorageOperations } from "~/types";
import { deleteItem, put } from "@webiny/db-dynamodb";

const createType = (): string => {
    return "pb.category";
};

export interface CreateCategoryStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createCategoryStorageOperations = ({
    entity,
    plugins
}: CreateCategoryStorageOperationsParams): CategoryStorageOperations => {
    const dataLoader = new CategoryDataLoader({
        entity
    });

    const get = async (params: CategoryStorageOperationsGetParams) => {
        const { where } = params;

        try {
            return await dataLoader.getOne(where);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load category by given parameters.",
                ex.code || "CATEGORY_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const create = async (params: CategoryStorageOperationsCreateParams) => {
        const { category } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: category.tenant,
                locale: category.locale
            }),
            SK: createSortKey(category)
        };

        try {
            await put({
                entity,
                item: {
                    ...category,
                    TYPE: createType(),
                    ...keys
                }
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return category;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create category.",
                ex.code || "CATEGORY_CREATE_ERROR",
                {
                    keys
                }
            );
        }
    };

    const update = async (params: CategoryStorageOperationsUpdateParams) => {
        const { original, category } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: original.tenant,
                locale: original.locale
            }),
            SK: createSortKey(category)
        };

        try {
            await put({
                entity,
                item: {
                    ...category,
                    TYPE: createType(),
                    ...keys
                }
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return category;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update category.",
                ex.code || "CATEGORY_UPDATE_ERROR",
                {
                    keys,
                    original,
                    category
                }
            );
        }
    };

    const deleteCategory = async (params: CategoryStorageOperationsDeleteParams) => {
        const { category } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: category.tenant,
                locale: category.locale
            }),
            SK: createSortKey(category)
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

            return category;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete category.",
                ex.code || "CATEGORY_DELETE_ERROR",
                {
                    keys,
                    category
                }
            );
        }
    };

    const list = async (params: CategoryStorageOperationsListParams) => {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({ tenant, locale }),
            options: {
                gt: " "
            }
        };

        let items: Category[] = [];

        try {
            items = await queryAll<Category>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list categories by given parameters.",
                ex.code || "CATEGORIES_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<CategoryDynamoDbElasticFieldPlugin>(
            CategoryDynamoDbElasticFieldPlugin.type
        );

        const filteredItems = filterItems<Category>({
            plugins,
            where: restWhere,
            items,
            fields
        });

        const sortedItems = sortItems<Category>({
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
        delete: deleteCategory,
        list
    };
};
