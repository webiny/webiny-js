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
import { MenuDynamoDbElasticFieldPlugin } from "~/plugins/definitions/MenuDynamoDbElasticFieldPlugin";

export interface Params {
    context: PbContext;
}

export interface PartitionKeyOptions {
    tenant: string;
    locale: string;
}

export class MenuStorageOperationsDdbEs implements MenuStorageOperations {
    protected readonly context: PbContext;
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
            SK: this.createSortKey(where)
        };

        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(this.entity, result.Item);
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

        const fields = this.context.plugins.byType<MenuDynamoDbElasticFieldPlugin>(
            MenuDynamoDbElasticFieldPlugin.type
        );

        const filteredItems = filterItems<Menu>({
            plugins: this.context.plugins,
            where: restWhere,
            items,
            fields
        }).map(item => {
            return cleanupItem<Menu>(this.entity, item);
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
    }

    public async create(params: MenuStorageOperationsCreateParams): Promise<Menu> {
        const { menu } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: menu.tenant,
                locale: menu.locale
            }),
            SK: this.createSortKey(menu)
        };

        try {
            await this.entity.put({
                ...menu,
                TYPE: this.createType(),
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
            SK: this.createSortKey(menu)
        };

        try {
            await this.entity.put({
                ...menu,
                TYPE: this.createType(),
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
            SK: this.createSortKey(menu)
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

    public createPartitionKey({ tenant, locale }: PartitionKeyOptions): string {
        return `T#${tenant}#L#${locale}#PB#M`;
    }

    public createSortKey(input: Pick<Menu, "slug"> | string): string {
        if (typeof input === "string") {
            return input;
        } else if (input.slug) {
            return input.slug;
        }
        throw new WebinyError(
            "Could not determine the menu sort key from the input.",
            "MALFORMED_SORT_KEY",
            {
                input
            }
        );
    }

    public createType(): string {
        return "pb.menu";
    }
}
