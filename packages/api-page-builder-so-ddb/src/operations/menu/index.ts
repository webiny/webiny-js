import {
    Menu,
    MenuStorageOperations,
    MenuStorageOperationsCreateParams,
    MenuStorageOperationsDeleteParams,
    MenuStorageOperationsGetParams,
    MenuStorageOperationsListParams,
    MenuStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { MenuDynamoDbFieldPlugin } from "~/plugins/definitions/MenuDynamoDbFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface PartitionKeyParams {
    tenant: string;
    locale: string;
}
const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#M`;
};

interface SortKeyParams {
    slug: string;
}
const createSortKey = (params: SortKeyParams): string => {
    const { slug } = params;
    return slug;
};

const createType = (): string => {
    return "pb.menu";
};

export interface Params {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createMenuStorageOperations = ({ entity, plugins }: Params): MenuStorageOperations => {
    const get = async (params: MenuStorageOperationsGetParams) => {
        const { where } = params;
        const keys = {
            PK: createPartitionKey(where),
            SK: createSortKey(where)
        };

        try {
            const result = await entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(entity, result.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load menu by given parameters.",
                ex.code || "MENU_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const create = async (params: MenuStorageOperationsCreateParams) => {
        const { menu } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: createSortKey(menu)
        };

        try {
            await entity.put({
                ...menu,
                TYPE: createType(),
                ...keys
            });
            return menu;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create menu.",
                ex.code || "MENU_CREATE_ERROR",
                {
                    keys,
                    menu
                }
            );
        }
    };

    const update = async (params: MenuStorageOperationsUpdateParams) => {
        const { menu, original } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: createSortKey(menu)
        };

        try {
            await entity.put({
                ...menu,
                TYPE: createType(),
                ...keys
            });
            return menu;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update menu.",
                ex.code || "MENU_UPDATE_ERROR",
                {
                    keys,
                    original,
                    menu
                }
            );
        }
    };

    const list = async (params: MenuStorageOperationsListParams) => {
        const { where, sort, limit } = params;

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

        let items: Menu[] = [];

        try {
            items = await queryAll<Menu>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list menus by given parameters.",
                ex.code || "MENUS_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<MenuDynamoDbFieldPlugin>(MenuDynamoDbFieldPlugin.type);

        const filteredItems = filterItems<Menu>({
            plugins,
            where: restWhere,
            items,
            fields
        }).map(item => {
            return cleanupItem<Menu>(entity, item);
        });

        const sortedItems = sortItems<Menu>({
            items: filteredItems,
            sort,
            fields
            ///: ["createdOn", "id", "title", "slug"]
        });

        return createListResponse({
            items: sortedItems,
            limit,
            totalCount: filteredItems.length,
            after: null
        });
    };

    const deleteMenu = async (params: MenuStorageOperationsDeleteParams) => {
        const { menu } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: createSortKey(menu)
        };

        try {
            await entity.delete({
                ...menu,
                ...keys
            });
            return menu;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete menu.",
                ex.code || "MENU_DELETE_ERROR",
                {
                    keys,
                    menu
                }
            );
        }
    };

    return {
        get,
        create,
        update,
        list,
        delete: deleteMenu
    };
};
