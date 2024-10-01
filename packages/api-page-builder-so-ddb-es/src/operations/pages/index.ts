import {
    Page,
    PageStorageOperations,
    PageStorageOperationsCreateFromParams,
    PageStorageOperationsCreateParams,
    PageStorageOperationsDeleteAllParams,
    PageStorageOperationsDeleteParams,
    PageStorageOperationsGetParams,
    PageStorageOperationsListParams,
    PageStorageOperationsListResponse,
    PageStorageOperationsListRevisionsParams,
    PageStorageOperationsListTagsParams,
    PageStorageOperationsPublishParams,
    PageStorageOperationsUnpublishParams,
    PageStorageOperationsUpdateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import omit from "lodash/omit";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { Client } from "@elastic/elasticsearch";
import {
    ElasticsearchBoolQueryConfig,
    ElasticsearchSearchResponse
} from "@webiny/api-elasticsearch/types";
import { configurations } from "~/configurations";
import { createLimit, encodeCursor } from "@webiny/api-elasticsearch";
import { createElasticsearchQueryBody } from "./elasticsearchQueryBody";
import { SearchLatestPagesPlugin } from "~/plugins/definitions/SearchLatestPagesPlugin";
import { SearchPublishedPagesPlugin } from "~/plugins/definitions/SearchPublishedPagesPlugin";
import { DbItem, queryAll, QueryAllParams, queryOne } from "@webiny/db-dynamodb/utils/query";
import { SearchPagesPlugin } from "~/plugins/definitions/SearchPagesPlugin";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { getESLatestPageData, getESPublishedPageData } from "./helpers";
import { PluginsContainer } from "@webiny/plugins";
import {
    createBasicType,
    createLatestSortKey,
    createLatestType,
    createPartitionKey,
    createPathPartitionKey,
    createPathSortKey,
    createPublishedPathType,
    createPublishedSortKey,
    createPublishedType,
    createSortKey
} from "./keys";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { PageDynamoDbElasticsearchFieldPlugin } from "~/plugins/definitions/PageDynamoDbElasticsearchFieldPlugin";
import { getClean, put } from "@webiny/db-dynamodb";
import { shouldIgnoreEsResponseError } from "~/operations/pages/shouldIgnoreEsResponseError";
import { logIgnoredEsResponseError } from "~/operations/pages/logIgnoredEsResponseError";

/**
 * This function removes attributes that were once present in the Page record, which we no longer need.
 */
function removePageAttributes(item: Page): Page {
    return omit(item, ["home", "notFound", "visibility"]) as Page;
}

export interface CreatePageStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    elasticsearch: Client;
    plugins: PluginsContainer;
}
export const createPageStorageOperations = (
    params: CreatePageStorageOperationsParams
): PageStorageOperations => {
    const { entity, esEntity, elasticsearch, plugins } = params;

    const create = async (params: PageStorageOperationsCreateParams): Promise<Page> => {
        const { page, input } = params;

        const versionKeys = {
            PK: createPartitionKey(page),
            SK: createSortKey(page)
        };
        const latestKeys = {
            ...versionKeys,
            SK: createLatestSortKey()
        };

        const items = [
            entity.putBatch({
                ...page,
                ...versionKeys,
                TYPE: createBasicType()
            }),
            entity.putBatch({
                ...page,
                ...latestKeys,
                TYPE: createLatestType()
            })
        ];
        const esData = getESLatestPageData(plugins, page, input);
        try {
            await batchWriteAll({
                table: entity.table,
                items: items
            });
            await put({
                entity: esEntity,
                item: {
                    index: configurations.es(page).index,
                    data: esData,
                    ...latestKeys
                }
            });
            return page;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create new page.",
                ex.code || "CREATE_PAGE_ERROR",
                {
                    versionKeys,
                    latestKeys,
                    page
                }
            );
        }
    };

    const createFrom = async (params: PageStorageOperationsCreateFromParams): Promise<Page> => {
        const { page, latestPage, original } = params;

        const versionKeys = {
            PK: createPartitionKey(page),
            SK: createSortKey(page)
        };
        const latestKeys = {
            ...versionKeys,
            SK: createLatestSortKey()
        };

        const items = [
            entity.putBatch({
                ...page,
                TYPE: createBasicType(),
                ...versionKeys
            }),
            entity.putBatch({
                ...page,
                TYPE: createLatestType(),
                ...latestKeys
            })
        ];

        const esData = getESLatestPageData(plugins, page);

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });

            await put({
                entity: esEntity,
                item: {
                    index: configurations.es(page).index,
                    data: esData,
                    ...latestKeys
                }
            });
            return page;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create new page from existing page.",
                ex.code || "CREATE_PAGE_FROM_ERROR",
                {
                    versionKeys,
                    latestKeys,
                    latestPage,
                    original,
                    page
                }
            );
        }
    };

    const update = async (params: PageStorageOperationsUpdateParams): Promise<Page> => {
        const { original, page, input } = params;

        const keys = {
            PK: createPartitionKey(page),
            SK: createSortKey(page)
        };

        const latestKeys = {
            ...keys,
            SK: createLatestSortKey()
        };
        const latestPage = await getClean<Page>({
            entity,
            keys: latestKeys
        });

        const items = [
            entity.putBatch({
                ...page,
                TYPE: createBasicType(),
                ...keys
            })
        ];

        const esData = getESLatestPageData(plugins, page, input);

        if (latestPage && latestPage?.id === page.id) {
            /**
             * We also update the regular record.
             */
            items.push(
                entity.putBatch({
                    ...page,
                    TYPE: createLatestType(),
                    ...latestKeys
                })
            );
        }
        /**
         * Unfortunately we cannot push regular and es record in the batch write because they are two separate tables.
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });

            await put({
                entity: esEntity,
                item: {
                    index: configurations.es(page).index,
                    data: esData,
                    ...latestKeys
                }
            });

            return page;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update existing page.",
                ex.code || "UPDATE_PAGE_ERROR",
                {
                    original,
                    page,
                    latestPage,
                    latestKeys,
                    keys
                }
            );
        }
    };

    /**
     * In case of delete, we must delete records:
     *  - revision
     *  - path if published
     * Update:
     *  - latest
     */
    const deleteOne = async (
        params: PageStorageOperationsDeleteParams
    ): Promise<[Page, Page | null]> => {
        const { page, latestPage, publishedPage } = params;

        const partitionKey = createPartitionKey(page);

        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createSortKey(page)
            })
        ];
        const esItems = [];
        if (publishedPage && publishedPage.id === page.id) {
            items.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
            items.push(
                entity.deleteBatch({
                    PK: createPathPartitionKey(page),
                    SK: createPathSortKey(page)
                })
            );
            esItems.push(
                esEntity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }
        let previousLatestPage: Page | null = null;
        if (latestPage && latestPage.id === page.id) {
            const previousLatestRecord = await queryOne<Page>({
                entity,
                partitionKey,
                options: {
                    lt: createSortKey(latestPage),
                    reverse: true
                }
            });
            if (previousLatestRecord) {
                items.push(
                    entity.putBatch({
                        ...previousLatestRecord,
                        TYPE: createLatestType(),
                        PK: partitionKey,
                        SK: createLatestSortKey()
                    })
                );
                esItems.push(
                    esEntity.putBatch({
                        PK: partitionKey,
                        SK: createLatestSortKey(),
                        index: configurations.es(page).index,
                        data: getESLatestPageData(plugins, previousLatestRecord)
                    })
                );
                previousLatestPage = cleanupItem(entity, previousLatestRecord);
            }
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write all the page records.",
                ex.code || "BATCH_WRITE_RECORDS_ERROR"
            );
        }
        if (esItems.length === 0) {
            return [page, previousLatestPage];
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write all the page Elasticsearch records.",
                ex.code || "BATCH_WRITE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return [page, previousLatestPage];
    };

    /**
     * In case of deleteAll, we must delete records:
     *  - latest
     *  - published
     *  - path if published
     *  - revision
     *  - es latest
     *  - es published
     */
    const deleteAll = async (params: PageStorageOperationsDeleteAllParams): Promise<[Page]> => {
        const { page } = params;

        const partitionKey = createPartitionKey(page);
        const queryAllParams = {
            entity,
            partitionKey,
            options: {
                gte: " "
            }
        };
        let revisions: DbItem<Page>[];
        try {
            revisions = await queryAll<Page>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not query for all revisions of the page.",
                ex.code || "LIST_REVISIONS_ERROR",
                {
                    params: queryAllParams
                }
            );
        }

        /**
         * We need to go through all possible entries and delete them.
         * Also, delete the published entry path record.
         */
        const items = [];
        let publishedPathEntryDeleted = false;
        for (const revision of revisions) {
            if (revision.status === "published" && !publishedPathEntryDeleted) {
                publishedPathEntryDeleted = true;
                items.push(
                    entity.deleteBatch({
                        PK: createPathPartitionKey(page),
                        SK: revision.path
                    })
                );
            }
            items.push(
                entity.deleteBatch({
                    PK: revision.PK,
                    SK: revision.SK
                })
            );
        }
        const esItems = [
            esEntity.deleteBatch({
                PK: partitionKey,
                SK: createLatestSortKey()
            })
        ];
        /**
         * Delete published record if it is published.
         */
        if (publishedPathEntryDeleted) {
            esItems.push(
                esEntity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete all the page records.",
                ex.code || "DELETE_RECORDS_ERROR"
            );
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete all the page Elasticsearch records.",
                ex.code || "DELETE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return [page];
    };

    const publish = async (params: PageStorageOperationsPublishParams): Promise<Page> => {
        const { page, latestPage, publishedPage } = params;

        page.status = "published";

        /**
         * Update the given revision of the page.
         */
        const items = [
            entity.putBatch({
                ...page,
                TYPE: createBasicType(),
                PK: createPartitionKey(page),
                SK: createSortKey(page)
            })
        ];
        const esItems = [];
        /**
         * If we are publishing the latest revision, update the latest revision
         * status in ES. We also need to update the latest page revision entry in ES.
         */
        if (latestPage.id === page.id) {
            items.push(
                entity.putBatch({
                    ...page,
                    TYPE: createLatestType(),
                    PK: createPartitionKey(page),
                    SK: createLatestSortKey()
                })
            );

            esItems.push(
                esEntity.putBatch({
                    PK: createPartitionKey(page),
                    SK: createLatestSortKey(),
                    index: configurations.es(page).index,
                    data: getESLatestPageData(plugins, page)
                })
            );
        }
        /**
         * If we already have a published revision, and it's not the revision being published:
         *  - set the existing published revision to "unpublished"
         */
        if (publishedPage && publishedPage.id !== page.id) {
            items.push(
                entity.putBatch({
                    ...publishedPage,
                    status: "unpublished",
                    PK: createPartitionKey(publishedPage),
                    SK: createSortKey(publishedPage)
                })
            );
            /**
             * Remove old published path if required.
             */
            if (publishedPage.path !== page.path) {
                items.push(
                    entity.deleteBatch({
                        PK: createPathPartitionKey(page),
                        SK: publishedPage.path
                    })
                );
            }
        }

        esItems.push(
            esEntity.putBatch({
                PK: createPartitionKey(page),
                SK: createPublishedSortKey(),
                index: configurations.es(page).index,
                data: getESPublishedPageData(plugins, page)
            })
        );

        /**
         * Update or insert published path.
         */
        items.push(
            entity.putBatch({
                ...page,
                TYPE: createPublishedPathType(),
                PK: createPathPartitionKey(page),
                SK: createPathSortKey(page)
            })
        );
        /**
         * Update or insert published page.
         */
        items.push(
            entity.putBatch({
                ...page,
                TYPE: createPublishedType(),
                PK: createPartitionKey(page),
                SK: createPublishedSortKey()
            })
        );

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update all the page records when publishing.",
                ex.code || "UPDATE_RECORDS_ERROR"
            );
        }
        /**
         * No point in continuing if there are no items in Elasticsearch data
         */
        if (esItems.length === 0) {
            return page;
        }
        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not update all the page Elasticsearch records when publishing.",
                ex.code || "UPDATE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return page;
    };

    const unpublish = async (params: PageStorageOperationsUnpublishParams): Promise<Page> => {
        const { page, latestPage } = params;

        page.status = "unpublished";

        const items = [
            entity.deleteBatch({
                PK: createPartitionKey(page),
                SK: createPublishedSortKey()
            }),
            entity.deleteBatch({
                PK: createPathPartitionKey(page),
                SK: createPathSortKey(page)
            }),
            entity.putBatch({
                ...page,
                TYPE: createBasicType(),
                PK: createPartitionKey(page),
                SK: createSortKey(page)
            })
        ];
        const esItems = [];
        /*
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
         */
        if (latestPage.id === page.id) {
            items.push(
                entity.putBatch({
                    ...page,
                    TYPE: createLatestType(),
                    PK: createPartitionKey(page),
                    SK: createLatestSortKey()
                })
            );
            esItems.push(
                esEntity.putBatch({
                    PK: createPartitionKey(page),
                    SK: createLatestSortKey(),
                    index: configurations.es(page).index,
                    data: getESLatestPageData(plugins, page)
                })
            );
        }

        esItems.push(
            esEntity.deleteBatch({
                PK: createPartitionKey(page),
                SK: createPublishedSortKey()
            })
        );

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update all the page records when unpublishing.",
                ex.code || "UPDATE_RECORDS_ERROR"
            );
        }
        /**
         * No need to go further if no Elasticsearch items to be applied.
         */
        if (esItems.length === 0) {
            return page;
        }
        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not update all the page Elasticsearch records when unpublishing.",
                ex.code || "UPDATE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return page;
    };

    const get = async (params: PageStorageOperationsGetParams): Promise<Page | null> => {
        const { where } = params;
        const { pid, id, path, published } = where;
        let { version } = where;
        /**
         * In case of having full ID and not having version we can take the version from the id.
         */
        if (id && id.includes("#") && !version) {
            version = Number(id.split("#").pop());
        }
        let partitionKey: string | null = null;
        let sortKey: string;
        if (path) {
            partitionKey = createPathPartitionKey(where);
            sortKey = path;
        } else if (published) {
            sortKey = createPublishedSortKey();
        } else if (version) {
            sortKey = createSortKey({
                version
            });
        } else {
            sortKey = createLatestSortKey();
        }
        /**
         * If partition key is still undefined, create one with id or pid
         */
        if (!partitionKey) {
            partitionKey = createPartitionKey({
                ...where,
                id: pid || (id as string)
            });
        }
        const keys = {
            PK: partitionKey,
            SK: sortKey
        };
        try {
            return await getClean({
                entity,
                keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page by given params.",
                ex.code || "GET_PAGE_ERROR",
                {
                    where,
                    keys
                }
            );
        }
    };

    const list = async (
        params: PageStorageOperationsListParams
    ): Promise<PageStorageOperationsListResponse> => {
        /**
         * We do not allow loading both published and latest at the same time.
         * @see PageStorageOperationsListWhere
         */
        if (params.where.published && params.where.latest) {
            throw new WebinyError(
                "Both published and latest cannot be defined at the same time.",
                "MALFORMED_WHERE_ERROR",
                {
                    where: params.where
                }
            );
        }

        const { after: previousCursor = null, limit: initialLimit } = params;

        const limit = createLimit(initialLimit, 50);
        const body = createElasticsearchQueryBody({
            ...params,
            where: {
                ...params.where
            },
            limit,
            after: previousCursor,
            plugins
        });

        let searchPlugins: SearchPagesPlugin[] = [];
        if (params.where.published) {
            searchPlugins = plugins.byType<SearchPublishedPagesPlugin>(
                SearchPublishedPagesPlugin.type
            );
        } else if (params.where.latest) {
            searchPlugins = plugins.byType<SearchLatestPagesPlugin>(SearchLatestPagesPlugin.type);
        } else {
            throw new WebinyError(
                "Only published or latest can be listed. Missing where condition.",
                "MALFORMED_WHERE_ERROR",
                {
                    where: params.where
                }
            );
        }

        for (const plugin of searchPlugins) {
            /**
             * Apply query modifications
             */
            plugin.modifyQuery({
                query: body.query as unknown as ElasticsearchBoolQueryConfig,
                args: params,
                plugins
            });

            /**
             * Apply sort modifications
             */
            plugin.modifySort({
                sort: body.sort,
                args: params,
                plugins
            });
        }

        let response: ElasticsearchSearchResponse<Page>;
        const esConfig = configurations.es(params.where);
        try {
            response = await elasticsearch.search({
                ...esConfig,
                body
            });
        } catch (ex) {
            /**
             * Do not throw the error if Elasticsearch index does not exist.
             * In some CRUDs we try to get list of pages but index was not created yet.
             */
            if (shouldIgnoreEsResponseError(ex)) {
                logIgnoredEsResponseError({
                    error: ex,
                    indexName: esConfig.index
                });
                return {
                    items: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    }
                };
            }
            throw new WebinyError(
                ex.message || "Could not load pages by given Elasticsearch body.",
                ex.code || "LIST_PAGES_ERROR",
                {
                    body
                }
            );
        }
        const { hits, total } = response.body.hits;
        const items = hits.map(item => item._source).map(item => removePageAttributes(item));

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            /**
             * Remove the last item from results, we don't want to include it.
             */
            items.pop();
        }
        /**
         * Cursor is the `sort` value of the last item in the array.
         * https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
         */
        const cursor =
            items.length > 0 && hasMoreItems
                ? encodeCursor(hits[items.length - 1].sort) || null
                : null;
        return {
            items,
            meta: {
                hasMoreItems,
                totalCount: total.value,
                cursor
            }
        };
    };

    const listTags = async (params: PageStorageOperationsListTagsParams): Promise<string[]> => {
        const { where } = params;

        const tenant: string = where.tenant;
        const body = createElasticsearchQueryBody({
            ...params,
            where: {
                locale: where.locale,
                search: undefined,
                tenant
            },
            sort: [],
            after: null,
            limit: 100000,
            plugins
        });

        const esConfig = configurations.es(where);

        try {
            const response: ElasticsearchSearchResponse<string> = await elasticsearch.search({
                ...esConfig,
                body: {
                    ...body,
                    sort: undefined,
                    limit: undefined,
                    size: 0,
                    aggs: {
                        tags: {
                            terms: {
                                field: "tags.keyword",
                                include: `.*${where.search}.*`,
                                size: 10
                            }
                        }
                    }
                }
            });

            const tags = response.body.aggregations["tags"];
            if (!tags || Array.isArray(tags.buckets) === false) {
                return [];
            }
            return tags.buckets.map(item => item.key);
        } catch (ex) {
            if (shouldIgnoreEsResponseError(ex)) {
                logIgnoredEsResponseError({
                    error: ex,
                    indexName: esConfig.index
                });
                return [];
            }
            throw new WebinyError(
                ex.message || "Could not list tags by given parameters.",
                ex.code || "LIST_TAGS_ERROR",
                {
                    body,
                    where
                }
            );
        }
    };

    const listRevisions = async (
        params: PageStorageOperationsListRevisionsParams
    ): Promise<Page[]> => {
        const { where, sort } = params;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                ...where,
                id: where.pid
            }),
            options: {
                beginsWith: "REV#",
                reverse: false
            }
        };

        let items: Page[] = [];
        try {
            items = await queryAll<Page>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all the revisions from requested page.",
                ex.code || "LOAD_PAGE_REVISIONS_ERROR",
                {
                    params
                }
            );
        }

        const fields = plugins.byType<PageDynamoDbElasticsearchFieldPlugin>(
            PageDynamoDbElasticsearchFieldPlugin.type
        );

        return sortItems({
            items: items.map(item => removePageAttributes(item)),
            fields,
            sort
        });
    };

    return {
        create,
        createFrom,
        update,
        delete: deleteOne,
        deleteAll: deleteAll,
        publish,
        unpublish,
        get,
        list,
        listRevisions,
        listTags
    };
};
