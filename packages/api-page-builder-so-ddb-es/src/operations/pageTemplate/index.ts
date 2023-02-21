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
import { queryAll, QueryAllParams, queryOne } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { PageTemplateDataLoader } from "./dataLoader";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { PageTemplateDynamoDbElasticFieldPlugin } from "~/plugins/definitions/PageTemplateDynamoDbElasticFieldPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { createGSI1PK, createPrimaryPK } from "./keys";
import { DataContainer } from "~/types";

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
            if (where.id) {
                return await dataLoader.getOne({
                    id: where.id,
                    tenant: where.tenant,
                    locale: where.locale
                });
            }

            const result = await queryOne<{ data: PageTemplate }>({
                entity,
                partitionKey: createGSI1PK(where),
                options: {
                    index: "GSI1",
                    eq: where.slug
                }
            });

            return result?.data || null;
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
            partitionKey: createGSI1PK({ tenant, locale }),
            options: {
                index: "GSI1",
                gt: " "
            }
        };

        let items: DataContainer<PageTemplate>[] = [];

        try {
            items = await queryAll<DataContainer<PageTemplate>>(queryAllParams);
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

        const filteredItems = filterItems<DataContainer<PageTemplate>>({
            plugins,
            where: restWhere,
            items,
            fields
        });

        const sortedItems = sortItems<DataContainer<PageTemplate>>({
            items: filteredItems,
            sort,
            fields
        });

        return createListResponse({
            items: sortedItems.map(item => item?.data).filter(Boolean),
            limit: limit || 100000,
            totalCount: filteredItems.length,
            after: null
        });
    };

    const create = async (params: PageTemplateStorageOperationsCreateParams) => {
        const { pageTemplate } = params;

        const keys = {
            PK: createPrimaryPK(pageTemplate),
            SK: "A",
            GSI1_PK: createGSI1PK(pageTemplate),
            GSI1_SK: pageTemplate.slug
        };

        try {
            await entity.put({
                data: pageTemplate,
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
            PK: createPrimaryPK(pageTemplate),
            SK: "A",
            GSI1_PK: createGSI1PK(pageTemplate),
            GSI1_SK: pageTemplate.slug
        };

        try {
            await entity.put({
                data: pageTemplate,
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
            PK: createPrimaryPK(pageTemplate),
            SK: "A"
        };

        try {
            await entity.delete({
                data: pageTemplate,
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
