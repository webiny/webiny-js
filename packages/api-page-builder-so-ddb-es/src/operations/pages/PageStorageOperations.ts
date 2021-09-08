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
    PageStorageOperationsRequestChangesParams,
    PageStorageOperationsRequestReviewParams,
    PageStorageOperationsUnpublishParams,
    PageStorageOperationsUpdateParams,
    PbContext
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { defineTable } from "~/definitions/table";
import { definePageEntity } from "~/definitions/pageEntity";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { Client } from "@elastic/elasticsearch";
import {
    ElasticsearchBoolQueryConfig,
    ElasticsearchContext
} from "@webiny/api-elasticsearch/types";
import configurations from "~/operations/configurations";
import { encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { createElasticsearchQueryBody } from "./elasticsearchQueryBody";
import { SearchLatestPagesPlugin } from "~/plugins/definitions/SearchLatestPagesPlugin";
import { SearchPublishedPagesPlugin } from "~/plugins/definitions/SearchPublishedPagesPlugin";
import { queryAll, QueryAllParams, queryOne } from "@webiny/db-dynamodb/utils/query";
import { SearchPagesPlugin } from "~/plugins/definitions/SearchPagesPlugin";
import { defineTableElasticsearch } from "~/definitions/tableElasticsearch";
import { definePageElasticsearchEntity } from "~/definitions/pageElasticsearchEntity";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { getESLatestPageData, getESPublishedPageData } from "./helpers";
import lodashGet from "lodash/get";
import { getZeroPaddedVersionNumber } from "@webiny/api-page-builder/utils/zeroPaddedVersionNumber";

const getElasticsearchClient = (context: any): Client => {
    const ctx = context as Partial<ElasticsearchContext>;
    if (!ctx.elasticsearch) {
        throw new WebinyError("Missing Elasticsearch client on the context");
    }
    return ctx.elasticsearch;
};

interface Params {
    context: PbContext;
}

interface EntityKeys {
    PK: string;
    SK: string;
}

type DbRecord<T> = T & { PK: string; SK: string; TYPE: string };

export class PageStorageOperationsDdbEs implements PageStorageOperations {
    protected readonly context: PbContext;
    protected readonly elasticsearch: Client;
    public readonly table: Table;
    public readonly esTable: Table;
    public readonly entity: Entity<any>;
    public readonly esEntity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.esTable = defineTableElasticsearch({
            context
        });

        this.entity = definePageEntity({
            context,
            table: this.table
        });

        this.esEntity = definePageElasticsearchEntity({
            context,
            table: this.esTable
        });

        this.elasticsearch = getElasticsearchClient(context);
    }

    public async create(params: PageStorageOperationsCreateParams): Promise<Page> {
        const { page } = params;

        const versionKeys: EntityKeys = {
            PK: this.createPartitionKey(page.id),
            SK: this.createSortKey(page.version)
        };
        const latestKeys: EntityKeys = {
            ...versionKeys,
            SK: this.createLatestSortKey()
        };

        const items = [
            this.entity.putBatch({
                ...page,
                ...versionKeys,
                TYPE: this.createBasicType()
            }),
            this.entity.putBatch({
                ...page,
                ...latestKeys,
                TYPE: this.createLatestType()
            })
        ];
        const esData = getESLatestPageData(this.context, page);
        try {
            await batchWriteAll({
                table: this.table,
                items: items
            });
            await this.esEntity.put({
                index: configurations.es(this.context).index,
                data: esData,
                ...latestKeys
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
    }

    public async createFrom(params: PageStorageOperationsCreateFromParams): Promise<Page> {
        const { page, latestPage, original } = params;

        const versionKeys: EntityKeys = {
            PK: this.createPartitionKey(page.id),
            SK: this.createSortKey(page.version)
        };
        const latestKeys: EntityKeys = {
            ...versionKeys,
            SK: this.createLatestSortKey()
        };

        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                ...versionKeys
            }),
            this.entity.putBatch({
                ...page,
                TYPE: this.createLatestType(),
                ...latestKeys
            })
        ];
        /**
         * Specifically for the Elasticsearch.
         * If visibility on the latest list is not false, push it into the ES.
         */
        let esData: any = undefined;
        if (lodashGet(page, "visibility.list.latest") !== false) {
            esData = getESLatestPageData(this.context, page);
        }

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
            if (esData) {
                await this.esEntity.put({
                    index: configurations.es(this.context).index,
                    data: esData,
                    ...latestKeys
                });
            }
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
    }

    public async update(params: PageStorageOperationsUpdateParams): Promise<Page> {
        const { original, page } = params;

        const keys: EntityKeys = {
            PK: this.createPartitionKey(page.id),
            SK: this.createSortKey(page.version)
        };

        const latestKeys: EntityKeys = {
            ...keys,
            SK: this.createLatestSortKey()
        };
        const latestPageResult = await this.entity.get(latestKeys);
        const latestPage = cleanupItem(
            this.entity,
            latestPageResult ? latestPageResult.Item : null
        );

        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                ...keys
            })
        ];
        /**
         * In the case the latest page is the page we are currently updating
         * check for the visibility in the list.
         * If visibility is set to false - delete the record
         * Otherwise update it.
         */
        let esData: Record<string, any> = undefined;
        let deleteEsRecord = false;
        if (latestPage && latestPage.id === page.id) {
            if (lodashGet(page, "visibility.list.latest") === false) {
                deleteEsRecord = true;
            } else {
                esData = getESLatestPageData(this.context, page);
            }
            /**
             * We also update the regular record.
             */
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    ...latestKeys
                })
            );
        }
        /**
         * Unfortunately we cannot push regular and es record in the batch write because they are two separate tables.
         */
        try {
            await batchWriteAll({
                table: this.table,
                items
            });

            if (deleteEsRecord) {
                await this.esEntity.delete({
                    ...latestKeys
                });
            } else if (esData) {
                await this.esEntity.put({
                    index: configurations.es(this.context).index,
                    data: esData,
                    ...latestKeys
                });
            }

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
    }
    /**
     * In case of delete, we must delete records:
     *  - revision
     *  - path if published
     * Update:
     *  - latest
     */
    public async delete(params: PageStorageOperationsDeleteParams): Promise<[Page, Page | null]> {
        const { page, latestPage, publishedPage } = params;

        const partitionKey = this.createPartitionKey(page.id);

        const items = [
            this.entity.deleteBatch({
                PK: partitionKey,
                SK: this.createSortKey(page.version)
            })
        ];
        const esItems = [];
        if (publishedPage && publishedPage.id === page.id) {
            items.push(
                this.entity.deleteBatch({
                    PK: partitionKey,
                    SK: this.createPublishedSortKey()
                })
            );
            items.push(
                this.entity.deleteBatch({
                    PK: this.createPathPartitionKey(),
                    SK: this.createPathSortKey(page)
                })
            );
            esItems.push(
                this.esEntity.deleteBatch({
                    PK: partitionKey,
                    SK: this.createPublishedSortKey()
                })
            );
        }
        let previousLatestPage: Page = null;
        if (latestPage && latestPage.id === page.id) {
            const previousLatestRecord = await queryOne<DbRecord<Page>>({
                entity: this.entity,
                partitionKey,
                options: {
                    lt: this.createSortKey(latestPage.version),
                    reverse: true
                }
            });
            if (previousLatestRecord) {
                items.push(
                    this.entity.putBatch({
                        ...previousLatestRecord,
                        TYPE: this.createLatestType(),
                        PK: partitionKey,
                        SK: this.createLatestSortKey()
                    })
                );
                esItems.push(
                    this.esEntity.putBatch({
                        PK: partitionKey,
                        SK: this.createLatestSortKey(),
                        index: configurations.es(this.context).index,
                        data: getESLatestPageData(this.context, previousLatestRecord)
                    })
                );
                previousLatestPage = cleanupItem(this.entity, previousLatestRecord);
            }
        }
        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write all the page records.",
                ex.code || "BATCH_WRITE_RECORDS_ERROR"
            );
        }
        try {
            await batchWriteAll({
                table: this.esTable,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write all the page Elasticsearch records.",
                ex.code || "BATCH_WWRITE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return [page, previousLatestPage];
    }
    /**
     * In case of deleteAll, we must delete records:
     *  - latest
     *  - published
     *  - path if published
     *  - revision
     *  - es latest
     *  - es published
     */
    public async deleteAll(params: PageStorageOperationsDeleteAllParams): Promise<[Page]> {
        const { page } = params;

        const partitionKey = this.createPartitionKey(page.id);
        const queryAllParams = {
            entity: this.entity,
            partitionKey,
            options: {
                gte: " "
            }
        };
        let revisions: DbRecord<Page>[];
        try {
            revisions = await queryAll(queryAllParams);
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
                    this.entity.deleteBatch({
                        PK: this.createPathPartitionKey(),
                        SK: revision.path
                    })
                );
            }
            items.push(
                this.entity.deleteBatch({
                    PK: revision.PK,
                    SK: revision.SK
                })
            );
        }
        const esItems = [
            this.esEntity.deleteBatch({
                PK: partitionKey,
                SK: this.createLatestSortKey()
            }),
            this.esEntity.deleteBatch({
                PK: partitionKey,
                SK: this.createPublishedSortKey()
            })
        ];

        try {
            await batchWriteAll({
                table: this.table,
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
                table: this.esTable,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete all the page Elasticsearch records.",
                ex.code || "DELETE_ELASTICSEARCH_RECORDS_ERROR"
            );
        }
        return [page];
    }
    /**
     * When publishing a page, we need to:
     *  - update that page record
     *  - update latest record if we are publishing latest one
     *  - update published record
     *  - update publish path to a new one
     */
    public async publish(params: PageStorageOperationsPublishParams): Promise<Page> {
        const { page, latestPage, publishedPage } = params;

        /**
         * Update the given revision of the page.
         */
        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        const esItems = [];
        /**
         * If we are publishing the latest revision, let's also update the latest revision entry's
         * status in ES. Also, if we are publishing the latest revision and the "LATEST page lists
         * visibility" is not false, then we need to update the latest page revision entry in ES.
         */
        if (latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createLatestSortKey()
                })
            );
            if (lodashGet(page, "visibility.list.latest") !== false) {
                esItems.push(
                    this.esEntity.putBatch({
                        PK: this.createPartitionKey(page.pid),
                        SK: this.createLatestSortKey(),
                        index: configurations.es(this.context).index,
                        data: getESLatestPageData(this.context, page)
                    })
                );
            }
        }
        /**
         * If we have already published revision of this page:
         *  - set existing published page revision to unpublished
         *  - remove old published path if paths are different
         */
        if (publishedPage) {
            items.push(
                this.entity.putBatch({
                    ...publishedPage,
                    status: "unpublished",
                    PK: this.createPartitionKey(publishedPage.pid),
                    SK: this.createSortKey(publishedPage.version)
                })
            );
            /**
             * Remove old published path if required.
             */
            if (publishedPage.path !== page.path) {
                items.push(
                    this.entity.deleteBatch({
                        PK: this.createPathPartitionKey(),
                        SK: publishedPage.path
                    })
                );
            }
        }
        /**
         * If we need to display the published page in the list.
         * Check only if it's not false, because only that should stop the propagation.
         */
        if (lodashGet(page, "visibility.list.published") !== false) {
            esItems.push(
                this.esEntity.putBatch({
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createPublishedSortKey(),
                    index: configurations.es(this.context).index,
                    data: getESPublishedPageData(this.context, page)
                })
            );
        } else {
            /**
             * Delete published record if not visible
             */
            esItems.push(
                this.esEntity.deleteBatch({
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createPublishedSortKey()
                })
            );
        }
        /**
         * Update or insert published path.
         */
        items.push(
            this.entity.putBatch({
                ...page,
                TYPE: this.createPublishedPathType(),
                PK: this.createPathPartitionKey(),
                SK: this.createPathSortKey(page)
            })
        );
        /**
         * Update or insert published page.
         */
        items.push(
            this.entity.putBatch({
                ...page,
                TYPE: this.createPublishedType(),
                PK: this.createPartitionKey(page.pid),
                SK: this.createPublishedSortKey()
            })
        );

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update all the page records when publishing.",
                ex.code || "UPDATE_RECORDS_ERROR"
            );
        }
        try {
            await batchWriteAll({
                table: this.esTable,
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
    }

    public async unpublish(params: PageStorageOperationsUnpublishParams): Promise<Page> {
        const { page, latestPage } = params;

        const items = [
            this.entity.deleteBatch({
                PK: this.createPartitionKey(page.pid),
                SK: this.createPublishedSortKey()
            }),
            this.entity.deleteBatch({
                PK: this.createPathPartitionKey(),
                SK: this.createPathSortKey(page)
            }),
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        const esItems = [];
        /*
         * If we are unpublishing the latest revision, let's also update the latest revision entry's
         * status in ES. We can only do that if the entry actually exists, or in other words, if the
         * published page's "LATEST pages lists visibility" setting is not set to false.
         */
        if (latestPage.id === page.id && lodashGet(page, "visibility.list.latest") !== false) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createLatestSortKey()
                })
            );
            esItems.push(
                this.esEntity.putBatch({
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createLatestSortKey(),
                    index: configurations.es(this.context).index,
                    data: getESLatestPageData(this.context, page)
                })
            );
        }
        if (lodashGet(page, "visibility.list.published") !== false) {
            esItems.push(
                this.esEntity.deleteBatch({
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createPublishedSortKey()
                })
            );
        }

        try {
            await batchWriteAll({
                table: this.table,
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
                table: this.esTable,
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
    }
    /**
     * We need to update:
     *  - regular record
     *  - latest record if page is the latest one
     *  - ES latest record if page is the latest one
     */
    public async requestReview(params: PageStorageOperationsRequestReviewParams): Promise<Page> {
        const { original, page, latestPage } = params;

        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        let esData = undefined;
        if (latestPage.id === page.id && lodashGet(page, "visibility.list.latest") !== false) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createLatestSortKey()
                })
            );
            esData = getESLatestPageData(this.context, page);
        }
        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not request review on page record.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    original,
                    page,
                    latestPage
                }
            );
        }
        /**
         * Just return if we do not need to update the Elasticsearch.
         */
        if (!esData) {
            return page;
        }

        try {
            await this.esEntity.put({
                PK: this.createPartitionKey(page.pid),
                SK: this.createLatestSortKey(),
                index: configurations.es(this.context).index,
                data: esData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not request review on page Elasticsearch record.",
                ex.code || "REQUEST_REVIEW_ES_ERROR",
                {
                    original,
                    page,
                    latestPage
                }
            );
        }

        return page;
    }

    public async requestChanges(params: PageStorageOperationsRequestChangesParams): Promise<Page> {
        const { original, page, latestPage } = params;

        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        let esData = undefined;
        if (latestPage.id === page.id && lodashGet(page, "visibility.list.latest") !== false) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPartitionKey(page.pid),
                    SK: this.createLatestSortKey()
                })
            );
            esData = getESLatestPageData(this.context, page);
        }

        try {
            await batchWriteAll({
                table: this.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not request changes on page record.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    original,
                    page,
                    latestPage
                }
            );
        }
        /**
         * Just return if we do not need to update the Elasticsearch.
         */
        if (!esData) {
            return page;
        }

        try {
            await this.esEntity.put({
                PK: this.createPartitionKey(page.pid),
                SK: this.createLatestSortKey(),
                index: configurations.es(this.context).index,
                data: esData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not request changes on page Elasticsearch record.",
                ex.code || "REQUEST_CHANGES_ES_ERROR",
                {
                    original,
                    page,
                    latestPage
                }
            );
        }

        return page;
    }

    /**
     * There are only few options to use when getting the page.
     * For that reason we try to have it as simple as possible when querying.
     */
    public async get(params: PageStorageOperationsGetParams): Promise<Page | null> {
        const { where } = params;
        const { pid, id, path, published } = where;
        let { version } = where;
        /**
         * In case of having full ID and not having version we can take the version from the id.
         */
        if (id && id.includes("#") && !version) {
            version = Number(id.split("#").pop());
        }
        let partitionKey: string = undefined;
        let sortKey: string;
        if (path) {
            partitionKey = this.createPathPartitionKey();
            sortKey = path;
        } else if (published) {
            sortKey = this.createPublishedSortKey();
        } else if (version) {
            sortKey = this.createSortKey(version);
        } else {
            sortKey = this.createLatestSortKey();
        }
        /**
         * If partition key is still undefined, create one with id or pid
         */
        if (!partitionKey) {
            partitionKey = this.createPartitionKey(pid || id);
        }
        const keys: EntityKeys = {
            PK: partitionKey,
            SK: sortKey
        };
        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return cleanupItem(this.entity, result.Item);
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
    }

    public async list(
        params: PageStorageOperationsListParams
    ): Promise<PageStorageOperationsListResponse> {
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

        const { after: previousCursor, limit: initialLimit } = params;

        const limit = createLimit(initialLimit, 50);
        const body = createElasticsearchQueryBody({
            ...params,
            where: {
                ...params.where
            },
            limit,
            after: previousCursor,
            context: this.context
        });

        let plugins: SearchPagesPlugin[] = [];
        if (params.where.published) {
            plugins = this.context.plugins.byType<SearchPublishedPagesPlugin>(
                SearchPublishedPagesPlugin.type
            );
        } else if (params.where.latest) {
            plugins = this.context.plugins.byType<SearchLatestPagesPlugin>(
                SearchLatestPagesPlugin.type
            );
        } else {
            throw new WebinyError(
                "Only published or latest can be listed. Missing where condition.",
                "MALFORMED_WHERE_ERROR",
                {
                    where: params.where
                }
            );
        }

        for (const plugin of plugins) {
            /**
             * Apply query modifications
             */
            plugin.modifyQuery({
                query: body.query as unknown as ElasticsearchBoolQueryConfig,
                args: params,
                context: this.context
            });

            /**
             * Apply sort modifications
             */
            plugin.modifySort({
                sort: body.sort,
                args: params,
                context: this.context
            });
        }

        let response;
        const esConfig = configurations.es(this.context);
        try {
            response = await this.elasticsearch.search({
                ...esConfig,
                body
            });
        } catch (ex) {
            /**
             * Do not throw the error if Elasticsearch index does not exist.
             * In some CRUDs we try to get list of pages but index was not created yet.
             */
            if (ex.message === "index_not_found_exception") {
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
        const items = hits.map(item => item._source);

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
            items.length > 0 && hasMoreItems ? encodeCursor(hits[items.length - 1].sort) : null;
        return {
            items,
            meta: {
                hasMoreItems,
                totalCount: total.value,
                cursor
            }
        };
    }
    /**
     * Listing of the revisions will be done through the DynamoDB since there are no revisions saved in the Elasticsearch.
     */
    public async listRevisions(params: PageStorageOperationsListRevisionsParams): Promise<Page[]> {
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey: this.createPartitionKey(params.where.pid),
            options: {
                beginsWith: "REV#",
                reverse: false
            }
        };

        try {
            return await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all the revisions from requested page.",
                ex.code || "LOAD_PAGE_REVISIONS_ERROR",
                {
                    params
                }
            );
        }
    }

    public async listTags(params: PageStorageOperationsListTagsParams): Promise<string[]> {
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
            limit: 100000,
            context: this.context
        });

        const esConfig = configurations.es(this.context);

        try {
            const response = await this.elasticsearch.search({
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
            return response.body.aggregations.tags.buckets.map(item => item.key);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list tags by given parameters.",
                ex.code || "LIST_TAGS_ERROR",
                {
                    body,
                    where
                }
            );
        }
    }
    /**
     * Used in multiple partition keys.
     */
    protected createBasePartitionKey(): string {
        const tenant = this.context.tenancy.getCurrentTenant().id;
        const locale = this.context.i18nContent.getLocale().code;
        return `T#${tenant}#L${locale}#PB#`;
    }

    protected createPartitionKey(id: string): string {
        if (id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${this.createBasePartitionKey()}P#${id}`;
    }

    protected createPathPartitionKey(): string {
        return `${this.createBasePartitionKey()}PATH`;
    }

    protected createSortKey(version: string | number): string {
        if (typeof version !== "number") {
            if (version.includes("#")) {
                version = Number(version.split("#").pop());
            }
        }
        return `REV#${getZeroPaddedVersionNumber(version)}`;
    }

    protected createPathSortKey(input: Pick<Page, "path"> | string): string {
        if (typeof input === "string") {
            return input;
        } else if (input.path) {
            return input.path;
        }
        throw new WebinyError(
            "Could not determine the page path sort key from the input.",
            "MALFORMED_SORT_KEY",
            {
                input
            }
        );
    }

    protected createPublishedSortKey(): string {
        return "P";
    }

    protected createLatestSortKey(): string {
        return "L";
    }

    protected createBasicType(): string {
        return "pb.page";
    }

    protected createLatestType(): string {
        return "pb.page.l";
    }

    protected createPublishedType(): string {
        return "pb.page.p";
    }

    protected createPublishedPathType(): string {
        return "pb.page.p.path";
    }
}
