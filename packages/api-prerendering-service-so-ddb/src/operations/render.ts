import WebinyError from "@webiny/error";
import {
    PrerenderingServiceRenderStorageOperations,
    PrerenderingServiceStorageOperationsCreateRenderParams,
    PrerenderingServiceStorageOperationsCreateTagPathLinksParams,
    PrerenderingServiceStorageOperationsDeleteRenderParams,
    PrerenderingServiceStorageOperationsDeleteTagPathLinksParams,
    PrerenderingServiceStorageOperationsGetRenderParams,
    PrerenderingServiceStorageOperationsListRendersParams,
    PrerenderingServiceStorageOperationsListTagPathLinksParams,
    Render,
    Tag,
    TagPathLink
} from "@webiny/api-prerendering-service/types";
import { Entity, EntityQueryOptions } from "@webiny/db-dynamodb/toolbox";
import { get } from "@webiny/db-dynamodb/utils/get";
import { queryAll, queryAllClean, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { DataContainer } from "~/types";
import { deleteItem, put } from "@webiny/db-dynamodb";

export interface CreateRenderStorageOperationsParams {
    entity: Entity<any>;
    tagPathLinkEntity: Entity<any>;
}

export interface CreateTagPathLinkPartitionKeyParams {
    tenant: string;
    tag: Tag;
    path: string;
}

export interface CreateTagPathLinkGSI1PartitionKeyParams {
    tenant: string;
    tag: Tag;
}

export interface CreateTagPathLinkSortKeyParams {
    tag: Tag;
    path?: string;
}

export const createRenderStorageOperations = (
    params: CreateRenderStorageOperationsParams
): PrerenderingServiceRenderStorageOperations => {
    const { entity, tagPathLinkEntity } = params;

    const createRenderPartitionKey = (tenant: string, path: string): string => {
        /**
         * For backwards compatibility remove the T# if it exists.
         */
        if (tenant.startsWith("T#")) {
            tenant = tenant.replace(/^T#/, "");
        }
        return `T#${tenant}#PS#RENDER#${path}`;
    };

    const createRenderSortKey = (): string => {
        return "A";
    };

    const createRenderGSI1PartitionKey = (tenant: string): string => {
        return `T#${tenant}#PS#RENDER`;
    };

    const createRenderType = (): string => {
        return "ps.render";
    };

    const createTagPathLinkPartitionKey = (params: CreateTagPathLinkPartitionKeyParams): string => {
        const { tag, path } = params;
        let { tenant } = params;
        if (tenant.startsWith("T#")) {
            tenant = tenant.replace(/^T#/, "");
        }
        return `T#${tenant}#PS#TAG#${tag.key}#${tag.value}#${path}`;
    };

    const createTagPathLinkSortKey = (params: CreateTagPathLinkSortKeyParams): string => {
        const { tag, path } = params;
        const values = [tag.value];
        if (path) {
            values.push(path);
        }
        return values.join("#");
    };

    const createTagPathLinkGSI1PartitionKey = (
        params: CreateTagPathLinkGSI1PartitionKeyParams
    ): string => {
        let { tenant } = params;
        if (tenant.startsWith("T#")) {
            tenant = tenant.replace(/^T#/, "");
        }
        return `T#${tenant}#PS#TAG`;
    };

    const createTagPathLinkGSI1SortKey = (params: CreateTagPathLinkSortKeyParams): string => {
        const { tag, path } = params;

        return `${tag.key}#${tag.value}#${path}`;
    };

    const createTagPathLinkType = (): string => {
        return "ps.tagPathLink";
    };

    const getRender = async (
        params: PrerenderingServiceStorageOperationsGetRenderParams
    ): Promise<Render | null> => {
        const { where } = params;

        const keys = {
            PK: createRenderPartitionKey(where.tenant, where.path),
            SK: createRenderSortKey()
        };

        try {
            const result = await get<DataContainer<Render>>({
                entity,
                keys
            });

            const dbItem = cleanupItem(entity, result);

            return dbItem ? dbItem.data : null;
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
            PK: createRenderPartitionKey(render.tenant, render.path),
            SK: createRenderSortKey()
        };

        try {
            await put({
                entity,
                item: {
                    ...keys,
                    data: render,
                    TYPE: createRenderType(),
                    GSI1_PK: createRenderGSI1PartitionKey(render.tenant),
                    GSI1_SK: render.path
                }
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
            PK: createRenderPartitionKey(render.tenant, render.path),
            SK: createRenderSortKey()
        };

        try {
            await deleteItem({
                entity,
                keys
            });
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
        const { tenant, tag } = where;
        /**
         * Possibly there is no tag.key so no need to go further
         */
        if (!tag || !tag.key) {
            return [];
        }

        const links = await listTagPathLinks({
            where: {
                tenant,
                tag
            }
        });

        const items = links.map(link => {
            return entity.getBatch({
                PK: createRenderPartitionKey(tenant, link.path),
                SK: createRenderSortKey()
            });
        });
        try {
            const results = await batchReadAll<DataContainer<Render>>({
                table: entity.table,
                items
            });
            return cleanupItems(entity, results).map(item => item.data);
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
        const { tenant, tag } = where;

        if (tag) {
            return listRendersByTag(params);
        }

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createRenderGSI1PartitionKey(tenant),
            options: {
                index: "GSI1",
                gte: " "
            }
        };

        try {
            const results = await queryAllClean<DataContainer<Render>>(queryAllParams);

            return results.map(item => item.data);
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

    const createTagPathLinks = async (
        params: PrerenderingServiceStorageOperationsCreateTagPathLinksParams
    ) => {
        const { tagPathLinks } = params;

        const items = tagPathLinks.map(item => {
            return tagPathLinkEntity.putBatch({
                data: item,
                TYPE: createTagPathLinkType(),
                PK: createTagPathLinkPartitionKey({
                    tenant: item.tenant,
                    tag: item,
                    path: item.path
                }),
                SK: createTagPathLinkSortKey({
                    tag: item,
                    path: item.path
                }),
                GSI1_PK: createTagPathLinkGSI1PartitionKey({ tag: item, tenant: item.tenant }),
                GSI1_SK: createTagPathLinkGSI1SortKey({ tag: item, path: item.path })
            });
        });

        try {
            await batchWriteAll({
                table: tagPathLinkEntity.table,
                items
            });
            return tagPathLinks;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create tagPathLink records.",
                ex.code || "CREATE_URL_TAG_LINKS_ERROR",
                {
                    tagPathLinks
                }
            );
        }
    };

    const deleteTagPathLinks = async (
        params: PrerenderingServiceStorageOperationsDeleteTagPathLinksParams
    ): Promise<void> => {
        const { tenant, tags, path } = params;
        const items = tags.map(tag => {
            return tagPathLinkEntity.deleteBatch({
                PK: createTagPathLinkPartitionKey({
                    tag,
                    tenant,
                    path
                }),
                SK: createTagPathLinkSortKey({
                    tag,
                    path
                })
            });
        });

        try {
            await batchWriteAll({
                table: tagPathLinkEntity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete tagPathLink records.",
                ex.code || "DELETE_URL_TAG_LINKS_ERROR",
                {
                    tags,
                    tenant,
                    path
                }
            );
        }
    };

    const listTagPathLinks = async (
        params: PrerenderingServiceStorageOperationsListTagPathLinksParams
    ) => {
        const { where } = params;
        const { tenant, tag } = where;

        const partitionKey = createTagPathLinkGSI1PartitionKey({
            tenant,
            tag
        });

        const options: EntityQueryOptions = {
            index: "GSI1"
        };

        if (tag.value) {
            options.beginsWith = `${tag.key}#${tag.value}#`;
        } else {
            options.beginsWith = `${tag.key}#`;
        }

        const queryAllParams: QueryAllParams = {
            entity: tagPathLinkEntity,
            partitionKey,
            options
        };

        try {
            const results = await queryAll<DataContainer<TagPathLink>>(queryAllParams);

            return cleanupItems(tagPathLinkEntity, results).map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list tagPathLink records.",
                ex.code || "LIST_TAG_PATH_LINK_ERROR",
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
        createTagPathLinks,
        deleteTagPathLinks,
        listTagPathLinks
    };
};
