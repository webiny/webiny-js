import WebinyError from "@webiny/error";
import {
    PageTemplate,
    PageTemplateStorageOperations,
    PageTemplateStorageOperationsCreateParams,
    PageTemplateStorageOperationsDeleteParams,
    PageTemplateStorageOperationsGetParams,
    PageTemplateStorageOperationsListParams,
    PageTemplateStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { PageTemplateDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { PageTemplateDynamoDbElasticFieldPlugin } from "~/plugins/definitions/PageTemplateDynamoDbElasticFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "./keys";

const createType = (): string => {
    return "pb.pageTemplate";
};

export interface CreatePageTemplateStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createPageTemplateStorageOperations = ({
    entity,
    plugins
}: CreatePageTemplateStorageOperationsParams): PageTemplateStorageOperations => {
    const dataLoader = new PageTemplateDataLoader({
        entity
    });

    const get = async (params: PageTemplateStorageOperationsGetParams) => {
        const { where } = params;

        try {
            return await dataLoader.getOne(where);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page template by given parameters.",
                ex.code || "PAGE_TEMPLATE_GET_ERROR",
                {
                    where
                }
            );
        }
    };

    const list = async (params: PageTemplateStorageOperationsListParams) => {
        const { where, sort, limit } = params;

        const { tenant, locale, ...restWhere } = where;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({ tenant, locale }),
            options: {
                gt: " "
            }
        };

        let items: PageTemplate[] = [];

        try {
            items = await queryAll<PageTemplate>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list page templates by given parameters.",
                ex.code || "PAGE_TEMPLATE_LIST_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const fields = plugins.byType<PageTemplateDynamoDbElasticFieldPlugin>(
            PageTemplateDynamoDbElasticFieldPlugin.type
        );

        const filteredItems = filterItems<PageTemplate>({
            plugins,
            where: restWhere,
            items,
            fields
        });

        const sortedItems = sortItems<PageTemplate>({
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

    const create = async (params: PageTemplateStorageOperationsCreateParams) => {
        const { pageTemplate } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: pageTemplate.tenant,
                locale: pageTemplate.locale
            }),
            SK: createSortKey(pageTemplate)
        };

        try {
            await entity.put({
                ...pageTemplate,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageTemplate;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create page template.",
                ex.code || "PAGE_TEMPLATE_CREATE_ERROR",
                {
                    keys
                }
            );
        }
    };

    const update = async (params: PageTemplateStorageOperationsUpdateParams) => {
        const { original, pageTemplate } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: original.tenant,
                locale: original.locale
            }),
            SK: createSortKey(pageTemplate)
        };

        try {
            await entity.put({
                ...pageTemplate,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageTemplate;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update page template.",
                ex.code || "PAGE_TEMPLATE_UPDATE_ERROR",
                {
                    keys,
                    original,
                    pageTemplate
                }
            );
        }
    };

    const deletePageTemplate = async (params: PageTemplateStorageOperationsDeleteParams) => {
        const { pageTemplate } = params;
        const keys = {
            PK: createPartitionKey({
                tenant: pageTemplate.tenant,
                locale: pageTemplate.locale
            }),
            SK: createSortKey(pageTemplate)
        };

        try {
            await entity.delete({
                ...pageTemplate,
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageTemplate;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete page template.",
                ex.code || "PAGE_TEMPLATE_DELETE_ERROR",
                {
                    keys,
                    pageTemplate
                }
            );
        }
    };

    return {
        get,
        list,
        create,
        update,
        delete: deletePageTemplate
    };
};
