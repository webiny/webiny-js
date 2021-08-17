import {
    Menu,
    MenuStorageOperations,
    MenuStorageOperationsCreateParams,
    MenuStorageOperationsDeleteParams,
    MenuStorageOperationsGetParams,
    MenuStorageOperationsListParams,
    MenuStorageOperationsListResponse,
    MenuStorageOperationsUpdateParams,
    PbContext
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { defineTable } from "~/definitions/table";
import { defineMenuEntity } from "~/definitions/menuEntity";

const TYPE = "pb.menu";

interface Params {
    context: PbContext;
}

export class MenuStorageOperationsDdbEs implements MenuStorageOperations {
    private readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineMenuEntity({
            context,
            table: this.table
        });
    }

    public async get(params: MenuStorageOperationsGetParams): Promise<Menu | null> {
        const { where } = params;
        const keys = {
            PK: this.createPartitionKey(where),
            SK: where.slug
        };

        try {
            const item = await this.entity.get(keys);
            return cleanupItem(this.entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load menu by given parameters.",
                ex.code || "MENU_GET_ERROR",
                {
                    where
                }
            );
        }
    }

    public async list(
        params: MenuStorageOperationsListParams
    ): Promise<MenuStorageOperationsListResponse> {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey: this.createPartitionKey({
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

        const filteredItems = filterItems<Menu>({
            context: this.context,
            where: restWhere,
            items
        }).map(item => {
            return cleanupItem<Menu>(this.entity, item);
        });

        const sortedItems = sortItems<Menu>({
            context: this.context,
            items: filteredItems,
            sort,
            fields: ["createdOn"]
        });

        return createListResponse({
            items: sortedItems,
            limit,
            totalCount: filteredItems.length,
            after: null
        });
    }

    public async create(params: MenuStorageOperationsCreateParams): Promise<Menu> {
        const { menu } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: menu.slug
        };

        try {
            await this.entity.put({
                ...menu,
                TYPE,
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
    }

    public async update(params: MenuStorageOperationsUpdateParams): Promise<Menu> {
        const { menu, original } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: menu.slug
        };

        try {
            await this.entity.put({
                ...menu,
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
    }

    public async delete(params: MenuStorageOperationsDeleteParams): Promise<Menu> {
        const { menu } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: menu.slug
        };

        try {
            await this.entity.delete({
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
    }

    private createPartitionKey({ tenant, locale }): string {
        return `T#${tenant}#L${locale}#PB#M`;
    }
}
