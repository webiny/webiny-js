import WebinyError from "@webiny/error";
import {
    PrerenderingServiceRenderStorageOperations,
    PrerenderingServiceStorageOperationsCreateRenderParams,
    PrerenderingServiceStorageOperationsCreateTagUrlLinksParams,
    PrerenderingServiceStorageOperationsDeleteRenderParams,
    PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams,
    PrerenderingServiceStorageOperationsGetRenderParams,
    PrerenderingServiceStorageOperationsListRendersParams,
    PrerenderingServiceStorageOperationsListTagUrlLinksParams,
    Render,
    TagUrlLink
} from "@webiny/api-prerendering-service/types";
import { Entity } from "dynamodb-toolbox";
import { get } from "@webiny/db-dynamodb/utils/get";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { Tag } from "@webiny/api-prerendering-service/queue/add/types";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";

export interface Params {
    entity: Entity<any>;
    tagUrlLinkEntity: Entity<any>;
}

export interface CreateTagUrlLinkPartitionKeyParams {
    namespace: string;
    tag: Pick<Tag, "key">;
}

export interface CreateTagUrlLinkSortKeyParams {
    tag: Tag;
    url?: string;
}

export const createRenderStorageOperations = (
    params: Params
): PrerenderingServiceRenderStorageOperations => {
    const { entity, tagUrlLinkEntity } = params;

    const createRenderPartitionKey = (namespace: string): string => {
        /**
         * For backwards compatibility remove the T# if it exists.
         */
        if (namespace.startsWith("T#")) {
            namespace = namespace.replace(/^T#/, "");
        }
        return `T#${namespace}#PS#RENDER`;
    };

    const createRenderSortKey = (url: string): string => {
        return url;
    };

    const createRenderType = (): string => {
        return "ps.render";
    };

    const createTagUrlLinkPartitionKey = (params: CreateTagUrlLinkPartitionKeyParams): string => {
        const { tag } = params;
        let { namespace } = params;
        if (namespace.startsWith("T#")) {
            namespace = namespace.replace(/^T#/, "");
        }
        return `T#${namespace}#PS#TAG#${tag.key}`;
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

    const getRender = async (
        params: PrerenderingServiceStorageOperationsGetRenderParams
    ): Promise<Render | null> => {
        const { where } = params;

        const keys = {
            PK: createRenderPartitionKey(where.namespace),
            SK: createRenderSortKey(where.url)
        };

        try {
            const result = await get<Render>({
                entity,
                keys
            });
            return cleanupItem(entity, result);
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
            await entity.put({
                ...render,
                ...keys,
                TYPE: createRenderType()
            });
            return render;
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
    const deleteRender = async (
        params: PrerenderingServiceStorageOperationsDeleteRenderParams
    ): Promise<void> => {
        const { render } = params;

        const keys = {
            PK: createRenderPartitionKey(render.namespace),
            SK: createRenderSortKey(render.url)
        };

        try {
            await entity.delete(keys);
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

        const links = await listTagUrlLinks({
            where: {
                namespace,
                tag
            }
        });

        const items = links.map(link => {
            return entity.getBatch({
                PK: createRenderPartitionKey(namespace),
                SK: createRenderSortKey(link.url)
            });
        });
        try {
            const results = await batchReadAll<Render>({
                table: entity.table,
                items
            });
            return cleanupItems(entity, results);
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
            const results = await queryAll<Render>(queryAllParams);

            return cleanupItems(entity, results);
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

    const createTagUrlLinks = async (
        params: PrerenderingServiceStorageOperationsCreateTagUrlLinksParams
    ) => {
        const { tagUrlLinks } = params;

        const items = tagUrlLinks.map(item => {
            return tagUrlLinkEntity.putBatch({
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
                table: tagUrlLinkEntity.table,
                items
            });
            return tagUrlLinks;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create tagUrlLink records.",
                ex.code || "CREATE_URL_TAG_LINKS_ERROR",
                {
                    tagUrlLinks
                }
            );
        }
    };

    const deleteTagUrlLinks = async (
        params: PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams
    ): Promise<void> => {
        const { namespace, tags, url } = params;
        const items = tags.map(tag => {
            return tagUrlLinkEntity.deleteBatch({
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
                table: tagUrlLinkEntity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete tagUrlLink records.",
                ex.code || "DELETE_URL_TAG_LINKS_ERROR",
                {
                    tags,
                    namespace,
                    url
                }
            );
        }
    };

    const listTagUrlLinks = async (
        params: PrerenderingServiceStorageOperationsListTagUrlLinksParams
    ) => {
        const { where } = params;
        const { namespace, tag } = where;

        const partitionKey = createTagUrlLinkPartitionKey({
            namespace,
            tag
        });

        const options: DynamoDBToolboxQueryOptions = {};
        if (tag.value) {
            options.beginsWith = `${tag.value}#`;
        } else {
            options.gte = " ";
        }

        const queryAllParams: QueryAllParams = {
            entity: tagUrlLinkEntity,
            partitionKey,
            options
        };

        try {
            const results = await queryAll<TagUrlLink>(queryAllParams);

            return cleanupItems(tagUrlLinkEntity, results);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list tagUrlLink records.",
                ex.code || "LIST_TAG_URL_LINK_ERROR",
                {
                    partitionKey,
                    options
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
        deleteTagUrlLinks,
        listTagUrlLinks
    };
};
