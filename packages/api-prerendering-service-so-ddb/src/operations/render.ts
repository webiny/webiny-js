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
    TagPathLink
} from "@webiny/api-prerendering-service/types";
import { Entity } from "dynamodb-toolbox";
import { get } from "@webiny/db-dynamodb/utils/get";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { Tag } from "@webiny/api-prerendering-service/types";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import { DataContainer } from "~/types";

export interface CreateRenderStorageOperationsParams {
    entity: Entity<any>;
    tagPathLinkEntity: Entity<any>;
}

export interface CreateTagPathLinkPartitionKeyParams {
    tenant: string;
    tag: Pick<Tag, "key">;
}

export interface CreateTagPathLinkSortKeyParams {
    tag: Tag;
    path?: string;
}

export const createRenderStorageOperations = (
    params: CreateRenderStorageOperationsParams
): PrerenderingServiceRenderStorageOperations => {
    const { entity, tagPathLinkEntity } = params;

    const createRenderPartitionKey = (tenant: string): string => {
        /**
         * For backwards compatibility remove the T# if it exists.
         */
        if (tenant.startsWith("T#")) {
            tenant = tenant.replace(/^T#/, "");
        }
        return `T#${tenant}#PS#RENDER`;
    };

    const createRenderSortKey = (path: string): string => {
        return path;
    };

    const createRenderGSI1PartitionKey = (): string => {
        return `PS#RENDER`;
    };

    const createRenderGSI1SortKey = (render: Render): string => {
        return `${render.tenant}#${render.locale}#${render.path}`;
    };

    const createRenderType = (): string => {
        return "ps.render";
    };

    const createTagPathLinkPartitionKey = (params: CreateTagPathLinkPartitionKeyParams): string => {
        const { tag } = params;
        let { tenant } = params;
        if (tenant.startsWith("T#")) {
            tenant = tenant.replace(/^T#/, "");
        }
        return `T#${tenant}#PS#TAG#${tag.key}`;
    };

    const createTagPathLinkSortKey = (params: CreateTagPathLinkSortKeyParams): string => {
        const { tag, path } = params;
        const values = [tag.value];
        if (path) {
            values.push(path);
        }
        return values.join("#");
    };

    const createTagPathLinkType = (): string => {
        return "ps.tagPathLink";
    };

    const getRender = async (
        params: PrerenderingServiceStorageOperationsGetRenderParams
    ): Promise<Render | null> => {
        const { where } = params;

        const keys = {
            PK: createRenderPartitionKey(where.tenant),
            SK: createRenderSortKey(where.path)
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
            PK: createRenderPartitionKey(render.tenant),
            SK: createRenderSortKey(render.path)
        };

        try {
            await entity.put({
                ...keys,
                data: render,
                TYPE: createRenderType(),
                GSI1_PK: createRenderGSI1PartitionKey(),
                GSI1_SK: createRenderGSI1SortKey(render)
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
            PK: createRenderPartitionKey(render.tenant),
            SK: createRenderSortKey(render.path)
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
                PK: createRenderPartitionKey(tenant),
                SK: createRenderSortKey(link.path)
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
            partitionKey: createRenderPartitionKey(tenant),
            options: {
                gte: " "
            }
        };

        try {
            const results = await queryAll<DataContainer<Render>>(queryAllParams);

            return cleanupItems(entity, results).map(item => item.data);
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
                    tag: item
                }),
                SK: createTagPathLinkSortKey({
                    tag: item,
                    path: item.path
                })
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
                    tenant
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

        const partitionKey = createTagPathLinkPartitionKey({
            tenant,
            tag
        });

        const options: DynamoDBToolboxQueryOptions = {};
        if (tag.value) {
            options.beginsWith = `${tag.value}#`;
        } else {
            options.gte = " ";
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
