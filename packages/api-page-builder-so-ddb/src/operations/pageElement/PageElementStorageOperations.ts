import {
    PageElement,
    PageElementStorageOperations,
    PageElementStorageOperationsCreateParams,
    PageElementStorageOperationsDeleteParams,
    PageElementStorageOperationsGetParams,
    PageElementStorageOperationsListParams,
    PageElementStorageOperationsListResponse,
    PageElementStorageOperationsUpdateParams,
    PbContext
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import WebinyError from "@webiny/error";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { defineTable } from "~/definitions/table";
import { definePageElementEntity } from "~/definitions/pageElementEntity";
import { PageElementDynamoDbFieldPlugin } from "~/plugins/definitions/PageElementDynamoDbFieldPlugin";

export interface Params {
    context: PbContext;
}

export interface PartitionKeyOptions {
    tenant: string;
    locale: string;
}

export class PageElementStorageOperationsDdb implements PageElementStorageOperations {
    protected readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = definePageElementEntity({
            context,
            table: this.table
        });
    }

    public async get(params: PageElementStorageOperationsGetParams): Promise<PageElement | null> {
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
                ex.message || "Could not load page element by given parameters.",
                ex.code || "PAGE_ELEMENT_GET_ERROR",
                {
                    where
                }
            );
        }
    }

    public async list(
        params: PageElementStorageOperationsListParams
    ): Promise<PageElementStorageOperationsListResponse> {
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

        const fields = this.context.plugins.byType<PageElementDynamoDbFieldPlugin>(
            PageElementDynamoDbFieldPlugin.type
        );

        const filteredItems = filterItems<PageElement>({
            context: this.context,
            where: restWhere,
            items: results,
            fields
        }).map(item => {
            return cleanupItem<PageElement>(this.entity, item);
        });

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
    }

    public async create(params: PageElementStorageOperationsCreateParams): Promise<PageElement> {
        const { pageElement } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: pageElement.tenant,
                locale: pageElement.locale
            }),
            SK: this.createSortKey(pageElement)
        };

        try {
            await this.entity.put({
                ...pageElement,
                TYPE: this.createType(),
                ...keys
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
    }

    public async update(params: PageElementStorageOperationsUpdateParams): Promise<PageElement> {
        const { pageElement, original } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: pageElement.tenant,
                locale: pageElement.locale
            }),
            SK: this.createSortKey(pageElement)
        };

        try {
            await this.entity.put({
                ...pageElement,
                TYPE: this.createType(),
                ...keys
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
    }

    public async delete(params: PageElementStorageOperationsDeleteParams): Promise<PageElement> {
        const { pageElement } = params;
        const keys = {
            PK: this.createPartitionKey({
                tenant: pageElement.tenant,
                locale: pageElement.locale
            }),
            SK: this.createSortKey(pageElement)
        };

        try {
            await this.entity.delete(keys);
            return pageElement;
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
    }

    public createPartitionKey({ tenant, locale }: PartitionKeyOptions): string {
        return `T#${tenant}#L#${locale}#PB#PE`;
    }

    public createSortKey(input: Pick<PageElement, "id"> | string): string {
        if (typeof input === "string") {
            return input;
        } else if (input.id) {
            return input.id;
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
        return "pb.pageElement";
    }
}
