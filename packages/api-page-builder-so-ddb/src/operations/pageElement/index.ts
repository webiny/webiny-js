import {
    PageElement,
    PageElementStorageOperations,
    PageElementStorageOperationsCreateParams,
    PageElementStorageOperationsDeleteParams,
    PageElementStorageOperationsGetParams,
    PageElementStorageOperationsListParams,
    PageElementStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { PageElementDynamoDbFieldPlugin } from "~/plugins/definitions/PageElementDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { deleteItem, getClean, put } from "@webiny/db-dynamodb";

interface PartitionKeyParams {
    tenant: string;
    locale: string;
}
const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#PE`;
};

interface SortKeyParams {
    id: string;
}
const createSortKey = (params: SortKeyParams): string => {
    const { id } = params;
    return id;
};

const createType = (): string => {
    return "pb.pageElement";
};

export interface CreatePageElementStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createPageElementStorageOperations = ({
    entity,
    plugins
}: CreatePageElementStorageOperationsParams): PageElementStorageOperations => {
    const create = async (params: PageElementStorageOperationsCreateParams) => {
        const { pageElement } = params;
        const keys = {
            PK: createPartitionKey(pageElement),
            SK: createSortKey(pageElement)
        };

        try {
            await put({
                entity,
                item: {
                    ...pageElement,
                    TYPE: createType(),
                    ...keys
                }
            });
            return pageElement;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create pageElement.",
                ex.code || "PAGE_ELEMENT_CREATE_ERROR",
                {
                    keys,
                    pageElement
                }
            );
        }
    };

    const update = async (params: PageElementStorageOperationsUpdateParams) => {
        const { pageElement, original } = params;
        const keys = {
            PK: createPartitionKey(pageElement),
            SK: createSortKey(pageElement)
        };

        try {
            await put({
                entity,
                item: {
                    ...pageElement,
                    TYPE: createType(),
                    ...keys
                }
            });
            return pageElement;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update pageElement.",
                ex.code || "PAGE_ELEMENT_UPDATE_ERROR",
                {
                    keys,
                    original,
                    pageElement
                }
            );
        }
    };

    const deletePageElement = async (params: PageElementStorageOperationsDeleteParams) => {
        const { pageElement } = params;
        const keys = {
            PK: createPartitionKey(pageElement),
            SK: createSortKey(pageElement)
        };

        try {
            await deleteItem({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete pageElement.",
                ex.code || "PAGE_ELEMENT_DELETE_ERROR",
                {
                    keys,
                    pageElement
                }
            );
        }
    };

    const get = async (params: PageElementStorageOperationsGetParams) => {
        const { where } = params;

        const keys = {
            PK: createPartitionKey(where),
            SK: createSortKey(where)
        };
        try {
            return await getClean<PageElement>({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page element by given parameters.",
                ex.code || "PAGE_ELEMENT_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const list = async (params: PageElementStorageOperationsListParams) => {
        const { where, sort, limit = 10 } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant,
                locale
            }),
            options: {
                limit: limit || undefined,
                gt: " "
            }
        };

        let results: PageElement[] = [];

        try {
            results = await queryAll<PageElement>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list page elements by given parameters.",
                ex.code || "PAGE_ELEMENTS_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<PageElementDynamoDbFieldPlugin>(
            PageElementDynamoDbFieldPlugin.type
        );

        const filteredItems = filterItems<PageElement>({
            plugins,
            where: restWhere,
            items: results,
            fields
        }).map(item => {
            return cleanupItem<PageElement>(entity, item);
        }) as PageElement[];

        const sortedItems = sortItems<PageElement>({
            items: filteredItems,
            sort,
            fields
        });

        return createListResponse({
            items: sortedItems,
            limit,
            totalCount: filteredItems.length,
            after: null
        });
    };

    return {
        get,
        create,
        update,
        delete: deletePageElement,
        list
    };
};
