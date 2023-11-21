import WebinyError from "@webiny/error";
import {
    PageBlock,
    PageBlockStorageOperationsCreateParams,
    PageBlockStorageOperationsDeleteParams,
    PageBlockStorageOperationsGetParams,
    PageBlockStorageOperationsListParams,
    PageBlockStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { PageBlockDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { PageBlockDynamoDbFieldPlugin } from "~/plugins/definitions/PageBlockDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createGSIPartitionKey, createGSISortKey, createPartitionKey, createSortKey } from "./keys";
import { PageBlockStorageOperations } from "~/types";
import { deleteItem, put } from "@webiny/db-dynamodb";
import { compress, decompress } from "./compression";

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
            const pageBlock = await dataLoader.getOne(where);
            return decompress(pageBlock);
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

        const { tenant, locale, blockCategory, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createGSIPartitionKey({ tenant, locale }),
            options: blockCategory
                ? {
                      index: "GSI1",
                      beginsWith: `${blockCategory}#`
                  }
                : {
                      index: "GSI1",
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
            items: await Promise.all(sortedItems.map(item => decompress(item))),
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
                locale: pageBlock.locale,
                id: pageBlock.id
            }),
            SK: createSortKey(),
            GSI1_PK: createGSIPartitionKey({ tenant: pageBlock.tenant, locale: pageBlock.locale }),
            GSI1_SK: createGSISortKey({ blockCategory: pageBlock.blockCategory, id: pageBlock.id })
        };

        try {
            await put({
                entity,
                item: {
                    ...pageBlock,
                    TYPE: createType(),
                    ...keys,
                    content: await compress(pageBlock.content)
                }
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
                locale: original.locale,
                id: pageBlock.id
            }),
            SK: createSortKey(),
            GSI1_PK: createGSIPartitionKey({ tenant: pageBlock.tenant, locale: pageBlock.locale }),
            GSI1_SK: createGSISortKey({ blockCategory: pageBlock.blockCategory, id: pageBlock.id })
        };

        try {
            await put({
                entity,
                item: {
                    ...pageBlock,
                    TYPE: createType(),
                    ...keys,
                    content: await compress(pageBlock.content)
                }
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
                locale: pageBlock.locale,
                id: pageBlock.id
            }),
            SK: createSortKey()
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
        dataLoader,
        get,
        list,
        create,
        update,
        delete: deletePageBlock
    };
};
