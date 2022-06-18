import WebinyError from "@webiny/error";
import {
    PageBlock,
    PageBlockStorageOperations,
    PageBlockStorageOperationsCreateParams,
    PageBlockStorageOperationsDeleteParams,
    PageBlockStorageOperationsGetParams,
    PageBlockStorageOperationsListParams,
    PageBlockStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { PageBlockDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { PageBlockDynamoDbFieldPlugin } from "~/plugins/definitions/PageBlockDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "./keys";

const createType = (): string => {
    return "pb.pageBlock";
};

export interface CreatePageBlockStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createPageBlockStorageOperations = ({
    entity,
    plugins
}: CreatePageBlockStorageOperationsParams): PageBlockStorageOperations => {
    const dataLoader = new PageBlockDataLoader({
        entity
    });

    const get = async (params: PageBlockStorageOperationsGetParams) => {
        const { where } = params;

        try {
            return await dataLoader.getOne(where);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page block by given parameters.",
                ex.code || "PAGE_BLOCK_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const list = async (params: PageBlockStorageOperationsListParams) => {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({ tenant, locale }),
            options: {
                gt: " "
            }
        };

        let items: PageBlock[] = [];

        try {
            items = await queryAll<PageBlock>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list page blocks by given parameters.",
                ex.code || "PAGE_BLOCK_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<PageBlockDynamoDbFieldPlugin>(
            PageBlockDynamoDbFieldPlugin.type
        );

        const filteredItems = filterItems<PageBlock>({
            plugins,
            where: restWhere,
            items,
            fields
        });

        const sortedItems = sortItems<PageBlock>({
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

    const create = async (params: PageBlockStorageOperationsCreateParams) => {
        const { pageBlock } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: pageBlock.tenant,
                locale: pageBlock.locale
            }),
            SK: createSortKey(pageBlock)
        };

        try {
            await entity.put({
                ...pageBlock,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageBlock;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create page block.",
                ex.code || "PAGE_BLOCK_CREATE_ERROR",
                {
                    keys
                }
            );
        }
    };

    const update = async (params: PageBlockStorageOperationsUpdateParams) => {
        const { original, pageBlock } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: original.tenant,
                locale: original.locale
            }),
            SK: createSortKey(pageBlock)
        };

        try {
            await entity.put({
                ...pageBlock,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageBlock;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update page block.",
                ex.code || "PAGE_BLOCK_UPDATE_ERROR",
                {
                    keys,
                    original,
                    pageBlock
                }
            );
        }
    };

    const deletePageBlock = async (params: PageBlockStorageOperationsDeleteParams) => {
        const { pageBlock } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: pageBlock.tenant,
                locale: pageBlock.locale
            }),
            SK: createSortKey(pageBlock)
        };

        try {
            await entity.delete({
                ...pageBlock,
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageBlock;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete page block.",
                ex.code || "PAGE_BLOCK_DELETE_ERROR",
                {
                    keys,
                    pageBlock
                }
            );
        }
    };



    return {
        get,
        list,
        create,
        update,
        delete: deletePageBlock
    };
};
