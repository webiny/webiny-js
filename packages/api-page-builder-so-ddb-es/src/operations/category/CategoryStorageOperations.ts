import {
    Category,
    CategoryStorageOperations,
    CategoryStorageOperationsCreateParams,
    CategoryStorageOperationsDeleteParams,
    CategoryStorageOperationsGetParams,
    CategoryStorageOperationsListParams,
    CategoryStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { PbContext } from "@webiny/api-page-builder/types";
import defineTable from "../../definitions/table";
import defineCategoryEntity from "../../definitions/categoryEntity";
import { Entity, Table } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import WebinyError from "@webiny/error";
import { CategoryDataLoader } from "./CategoryDataLoader";

const TYPE = "pb.category";

interface Params {
    context: PbContext;
}
export class CategoryStorageOperationsDdbEs implements CategoryStorageOperations {
    private readonly context: PbContext;
    private readonly dataLoader: CategoryDataLoader;
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
            context,
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

    public async list(params: CategoryStorageOperationsListParams): Promise<Category[]> {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey: this.createPartitionKey({ tenant, locale }),
            options: {
                limit: limit || undefined,
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

        const filteredItems = filterItems<Category>({
            context: this.context,
            where: restWhere,
            items
        });

        return sortItems<Category>({
            context: this.context,
            items: filteredItems,
            sort,
            fields: ["createdOn"]
        });
    }

    public async create(params: CategoryStorageOperationsCreateParams): Promise<Category> {
        const { category } = params;

        const keys = {
            PK: this.createPartitionKey({
                tenant: category.tenant,
                locale: category.locale
            }),
            SK: category.slug
        };

        try {
            await this.entity.put({
                ...category,
                TYPE,
                ...keys
            });
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
            SK: category.slug
        };

        try {
            await this.entity.put({
                ...category,
                ...keys
            });
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
            SK: category.slug
        };

        try {
            await this.entity.delete({
                ...category,
                ...keys
            });
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

    public createPartitionKey({ tenant, locale }): string {
        return `T#${tenant}#L${locale}PB#C`;
    }
}
