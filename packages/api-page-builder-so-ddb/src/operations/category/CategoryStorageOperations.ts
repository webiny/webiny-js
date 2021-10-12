import {
    Category,
    CategoryStorageOperations,
    CategoryStorageOperationsCreateParams,
    CategoryStorageOperationsDeleteParams,
    CategoryStorageOperationsGetParams,
    CategoryStorageOperationsListParams,
    CategoryStorageOperationsListResponse,
    CategoryStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { PbContext } from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import WebinyError from "@webiny/error";
import { CategoryDataLoader } from "./CategoryDataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { defineTable } from "~/definitions/table";
import { defineCategoryEntity } from "~/definitions/categoryEntity";
import { CategoryDynamoDbFieldPlugin } from "~/plugins/definitions/CategoryDynamoDbFieldPlugin";

export interface Params {
    context: PbContext;
}

export interface PartitionKeyOptions {
    tenant: string;
    locale: string;
}

export class CategoryStorageOperationsDdb implements CategoryStorageOperations {
    protected readonly context: PbContext;
    protected readonly dataLoader: CategoryDataLoader;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineCategoryEntity({
            context,
            table: this.table
        });

        this.dataLoader = new CategoryDataLoader({
            storageOperations: this
        });
    }

    public async get(params: CategoryStorageOperationsGetParams): Promise<Category | null> {
        const { where } = params;

        try {
            return await this.dataLoader.getOne(where);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load category by given parameters.",
                ex.code || "CATEGORY_GET_ERROR",
                {
                    where
                }
            );
        }
    }

    public async list(
        params: CategoryStorageOperationsListParams
    ): Promise<CategoryStorageOperationsListResponse> {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey: this.createPartitionKey({ tenant, locale }),
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

        const fields = this.context.plugins.byType<CategoryDynamoDbFieldPlugin>(
            CategoryDynamoDbFieldPlugin.type
        );

        const filteredItems = filterItems<Category>({
            plugins: this.context.plugins,
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
    }

    public async create(params: CategoryStorageOperationsCreateParams): Promise<Category> {
        const { category } = params;

        const keys = {
            PK: this.createPartitionKey({
                tenant: category.tenant,
                locale: category.locale
            }),
            SK: this.createSortKey(category)
        };

        try {
            await this.entity.put({
                ...category,
                TYPE: this.createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            this.dataLoader.clear();

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
    }

    public async update(params: CategoryStorageOperationsUpdateParams): Promise<Category> {
        const { original, category } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: original.tenant,
                locale: original.locale
            }),
            SK: this.createSortKey(category)
        };

        try {
            await this.entity.put({
                ...category,
                TYPE: this.createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            this.dataLoader.clear();

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
    }

    public async delete(params: CategoryStorageOperationsDeleteParams): Promise<Category> {
        const { category } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: category.tenant,
                locale: category.locale
            }),
            SK: this.createSortKey(category)
        };

        try {
            await this.entity.delete({
                ...category,
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            this.dataLoader.clear();

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
    }

    public createPartitionKey({ tenant, locale }: PartitionKeyOptions): string {
        return `T#${tenant}#L#${locale}#PB#C`;
    }
    /**
     * Either string or object with slug property can be passed to get back the sort key.
     */
    public createSortKey(input: Pick<Category, "slug"> | string): string {
        if (typeof input === "string") {
            return input;
        } else if (input.slug) {
            return input.slug;
        }
        throw new WebinyError(
            "Could not determine the category sort key from the input.",
            "MALFORMED_SORT_KEY",
            {
                input
            }
        );
    }

    public createType(): string {
        return "pb.category";
    }
}
