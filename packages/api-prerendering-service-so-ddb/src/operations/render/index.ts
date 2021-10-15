import WebinyError from "@webiny/error";
import {
    PrerenderingServiceRenderStorageOperations,
    PrerenderingServiceStorageOperationsCreateRenderParams,
    PrerenderingServiceStorageOperationsCreateTagUrlLinksParams,
    PrerenderingServiceStorageOperationsDeleteRenderParams,
    PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams,
    PrerenderingServiceStorageOperationsGetRenderParams,
    PrerenderingServiceStorageOperationsListRendersParams,
    Render,
    TagUrlLink
} from "@webiny/api-prerendering-service/types";
import { Entity } from "dynamodb-toolbox";
import { get } from "@webiny/db-dynamodb/utils/get";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { Tag } from "@webiny/api-prerendering-service/queue/add/types";

export interface Params {
    entity: Entity<any>;
    urlTagLinkEntity: Entity<any>;
}

export interface CreateTagUrlLinkPartitionKeyParams {
    namespace: string;
    tag: Tag;
}

export interface CreateTagUrlLinkSortKeyParams {
    tag: Tag;
    url?: string;
}

export const createRenderStorageOperations = (
    params: Params
): PrerenderingServiceRenderStorageOperations => {
    const { entity, urlTagLinkEntity } = params;

    const createRenderPartitionKey = (namespace: string): string => {
        return `${namespace}#PS#RENDER`;
    };

    const createRenderSortKey = (url: string): string => {
        return url;
    };

    const createRenderType = (): string => {
        return "ps.render";
    };

    const getRender = async (params: PrerenderingServiceStorageOperationsGetRenderParams) => {
        const { where } = params;

        const keys = {
            PK: createRenderPartitionKey(where.namespace),
            SK: createRenderSortKey(where.url)
        };

        try {
            return await get<Render>({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get render record by given key.",
                ex.code || "GET_RENDER_ERROR",
                {
                    keys,
                    params
                }
            );
        }
    };
    const createRender = async (params: PrerenderingServiceStorageOperationsCreateRenderParams) => {
        const { render } = params;

        const keys = {
            PK: createRenderPartitionKey(render.namespace),
            SK: createRenderSortKey(render.url)
        };

        try {
            return await entity.put({
                ...render,
                ...keys,
                TYPE: createRenderType()
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create render record.",
                ex.code || "CREATE_RENDER_ERROR",
                {
                    keys,
                    render
                }
            );
        }
    };
    const deleteRender = async (params: PrerenderingServiceStorageOperationsDeleteRenderParams) => {
        const { render } = params;

        const keys = {
            PK: createRenderPartitionKey(render.namespace),
            SK: createRenderSortKey(render.url)
        };

        try {
            return await entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete render record.",
                ex.code || "DELETE_RENDER_ERROR",
                {
                    keys,
                    render
                }
            );
        }
    };

    const listRendersByTag = async (
        params: PrerenderingServiceStorageOperationsListRendersParams
    ) => {
        const { where } = params;
        const { namespace, tag } = where;
        /**
         * Possibly there is no tag.key so no need to go further
         */
        if (!tag || !tag.key) {
            return [];
        }

        const partitionKey = createTagUrlLinkPartitionKey({
            tag,
            namespace
        });
        const options: DynamoDBToolboxQueryOptions = {};
        if (tag.value) {
            options.beginsWith = `${tag.value}#`;
        } else {
            options.gte = " ";
        }

        const queryAllParams: QueryAllParams = {
            entity: urlTagLinkEntity,
            partitionKey,
            options
        };

        let links: TagUrlLink[] = [];
        try {
            links = await queryAll<TagUrlLink>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list tagUrlLink records.",
                ex.code || "LIST_TAG_URL_LINK_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }

        const items = links.map(link => {
            return entity.getBatch({
                PK: createRenderPartitionKey(namespace),
                SK: createRenderSortKey(link.url)
            });
        });
        try {
            return await batchReadAll<Render>({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list render records after links.",
                ex.code || "LIST_LINKS_RENDER_ERROR",
                {
                    links
                }
            );
        }
    };

    const listRenders = async (params: PrerenderingServiceStorageOperationsListRendersParams) => {
        const { where } = params;
        const { namespace, tag } = where;

        if (tag) {
            return listRendersByTag(params);
        }

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createRenderPartitionKey(namespace),
            options: {
                gte: " "
            }
        };

        try {
            return await queryAll<Render>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list render records.",
                ex.code || "LIST_RENDER_ERROR",
                {
                    partitionKey: queryAllParams.partitionKey,
                    options: queryAllParams.options
                }
            );
        }
    };

    const createTagUrlLinkPartitionKey = (params: CreateTagUrlLinkPartitionKeyParams): string => {
        const { namespace, tag } = params;
        return `${namespace}#PS#TAG#${tag.key}`;
    };

    const createTagUrlLinkSortKey = (params: CreateTagUrlLinkSortKeyParams): string => {
        const { tag, url } = params;
        const values = [tag.value];
        if (url) {
            values.push(url);
        }
        return values.join("#");
    };

    const createTagUrlLinkType = (): string => {
        return "ps.tagUrlLink";
    };

    const createTagUrlLinks = async (
        params: PrerenderingServiceStorageOperationsCreateTagUrlLinksParams
    ) => {
        const { tagUrlLinks } = params;

        const items = tagUrlLinks.map(item => {
            return urlTagLinkEntity.putBatch({
                ...item,
                TYPE: createTagUrlLinkType(),
                PK: createTagUrlLinkPartitionKey({
                    namespace: item.namespace,
                    tag: item
                }),
                SK: createTagUrlLinkSortKey({
                    tag: item,
                    url: item.url
                })
            });
        });

        try {
            await batchWriteAll({
                table: urlTagLinkEntity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create urlTagLink records.",
                ex.code || "CREATE_URL_TAG_LINKS_ERROR",
                {
                    tagUrlLinks
                }
            );
        }

        return tagUrlLinks;
    };

    const deleteTagUrlLinks = async (
        params: PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams
    ): Promise<void> => {
        const { namespace, tags, url } = params;
        const items = tags.map(tag => {
            return urlTagLinkEntity.deleteBatch({
                PK: createTagUrlLinkPartitionKey({
                    tag,
                    namespace
                }),
                SK: createTagUrlLinkSortKey({
                    tag,
                    url
                })
            });
        });

        try {
            await batchWriteAll({
                table: urlTagLinkEntity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete urlTagLink records.",
                ex.code || "DELETE_URL_TAG_LINKS_ERROR",
                {
                    tags,
                    namespace,
                    url
                }
            );
        }
    };

    return {
        createRender,
        deleteRender,
        listRenders,
        getRender,
        createTagUrlLinks,
        deleteTagUrlLinks
    };
};
