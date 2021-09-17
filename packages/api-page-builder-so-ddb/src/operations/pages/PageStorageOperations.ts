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
import { queryAll, QueryAllParams, queryOne } from "@webiny/db-dynamodb/utils/query";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import lodashGet from "lodash/get";
import { getZeroPaddedVersionNumber } from "@webiny/api-page-builder/utils/zeroPaddedVersionNumber";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { PageDynamoDbFieldPlugin } from "~/plugins/definitions/PageDynamoDbFieldPlugin";

interface Params {
    context: PbContext;
}

interface EntityKeys {
    PK: string;
    SK: string;
}

type DbRecord<T> = T & { PK: string; SK: string; TYPE: string };

const GSI1_INDEX = "GSI1";

export class PageStorageOperationsDdb implements PageStorageOperations {
    protected readonly context: PbContext;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context,
            indexes: {
                [GSI1_INDEX]: {
                    partitionKey: "GSI1_PK",
                    sortKey: "GSI1_SK"
                }
            }
        });

        this.entity = definePageEntity({
            context,
            table: this.table
        });
    }

    public async create(params: PageStorageOperationsCreateParams): Promise<Page> {
        const { page } = params;

        const versionKeys: EntityKeys = {
            PK: this.createPagePartitionKey(page.id),
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
        try {
            await batchWriteAll({
                table: this.table,
                items: items
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
            PK: this.createPagePartitionKey(page.id),
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

        try {
            await batchWriteAll({
                table: this.table,
                items
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
    }

    public async update(params: PageStorageOperationsUpdateParams): Promise<Page> {
        const { original, page } = params;

        const keys: EntityKeys = {
            PK: this.createPagePartitionKey(page.id),
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
        if (latestPage && latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    ...latestKeys
                })
            );
        }

        try {
            await batchWriteAll({
                table: this.table,
                items
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

        const partitionKey = this.createPagePartitionKey(page.id);

        const items = [
            this.entity.deleteBatch({
                PK: partitionKey,
                SK: this.createSortKey(page.version)
            })
        ];
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

        const partitionKey = this.createPagePartitionKey(page.id);
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
                PK: this.createPagePartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
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
                    PK: this.createPagePartitionKey(page.pid),
                    SK: this.createLatestSortKey()
                })
            );
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
                    PK: this.createPagePartitionKey(publishedPage.pid),
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
                PK: this.createPagePartitionKey(page.pid),
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
        return page;
    }

    public async unpublish(params: PageStorageOperationsUnpublishParams): Promise<Page> {
        const { page, latestPage } = params;

        const items = [
            this.entity.deleteBatch({
                PK: this.createPagePartitionKey(page.pid),
                SK: this.createPublishedSortKey()
            }),
            this.entity.deleteBatch({
                PK: this.createPathPartitionKey(),
                SK: this.createPathSortKey(page)
            }),
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPagePartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
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
                    PK: this.createPagePartitionKey(page.pid),
                    SK: this.createLatestSortKey()
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
        return page;
    }
    /**
     * We need to update:
     *  - regular record
     *  - latest record if page is the latest one
     */
    public async requestReview(params: PageStorageOperationsRequestReviewParams): Promise<Page> {
        const { original, page, latestPage } = params;

        const items = [
            this.entity.putBatch({
                ...page,
                TYPE: this.createBasicType(),
                PK: this.createPagePartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        if (latestPage.id === page.id && lodashGet(page, "visibility.list.latest") !== false) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPagePartitionKey(page.pid),
                    SK: this.createLatestSortKey()
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
                ex.message || "Could not request review on page record.",
                ex.code || "REQUEST_REVIEW_ERROR",
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
                PK: this.createPagePartitionKey(page.pid),
                SK: this.createSortKey(page.version)
            })
        ];
        if (latestPage.id === page.id && lodashGet(page, "visibility.list.latest") !== false) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    TYPE: this.createLatestType(),
                    PK: this.createPagePartitionKey(page.pid),
                    SK: this.createLatestSortKey()
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
                ex.message || "Could not request changes on page record.",
                ex.code || "REQUEST_CHANGES_ERROR",
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
            partitionKey = this.createPagePartitionKey(pid || id);
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

        const { limit: initialLimit, after: previousCursor } = params;

        const limit = initialLimit || 50;

        const options: QueryAllParams["options"] = {
            index: GSI1_INDEX,
            gte: " "
        };
        const partitionKey = this.createPartitionKey();
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey,
            options
        };

        let dbRecords: Page[] = [];
        try {
            dbRecords = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load pages by given query params.",
                ex.code || "LIST_PAGES_ERROR",
                {
                    partitionKey,
                    options
                }
            );
        }

        const fields = this.context.plugins.byType<PageDynamoDbFieldPlugin>(
            PageDynamoDbFieldPlugin.type
        );

        const filteredPages = filterItems<Page>({
            items: dbRecords,
            context: this.context,
            where: params.where,
            fields
        });

        const sortedPages = sortItems<Page>({
            items: filteredPages,
            sort: params.sort,
            fields,
            context: this.context
        });

        const totalCount = sortedPages.length;

        const start = decodeCursor(previousCursor) || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const pages = sortedPages.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = pages.length > 0 ? encodeCursor(start + limit) : null;

        const meta = {
            hasMoreItems,
            totalCount,
            cursor
        };

        return {
            items: pages,
            meta
        };
    }
    /**
     * Listing of the revisions will be done through the DynamoDB since there are no revisions saved in the Elasticsearch.
     */
    public async listRevisions(params: PageStorageOperationsListRevisionsParams): Promise<Page[]> {
        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey: this.createPagePartitionKey(params.where.pid),
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

        const { items: pages } = await this.list({
            where: {
                locale: where.locale,
                tenant: where.tenant
            },
            sort: [],
            /**
             * Lets hope nobody comes even close to this limit.
             */
            limit: 100000
        });

        const search = where.search;

        return pages.reduce((collection, page) => {
            let list = lodashGet(page, "settings.general.tags");
            if (!list || list.length === 0) {
                return collection;
            } else if (search) {
                const re = new RegExp(search, "i");
                list = list.filter(t => t.match(re) !== null);
            }
            collection.push(...list);
            return collection;
        }, []);
    }
    /**
     * Used in multiple partition keys.
     */
    public createBasePartitionKey(): string {
        const tenant = this.context.tenancy.getCurrentTenant().id;
        const locale = this.context.i18nContent.getLocale().code;
        return `T#${tenant}#L#${locale}#PB#`;
    }

    public createPartitionKey(): string {
        return `${this.createBasePartitionKey()}P`;
    }

    public createPagePartitionKey(id: string): string {
        if (id.includes("#")) {
            id = id.split("#").shift();
        }
        return `${this.createPartitionKey()}#${id}`;
    }

    public createPathPartitionKey(): string {
        return `${this.createBasePartitionKey()}PATH`;
    }

    public createSortKey(version: string | number): string {
        if (typeof version !== "number") {
            if (version.includes("#")) {
                version = Number(version.split("#").pop());
            }
        }
        return `REV#${getZeroPaddedVersionNumber(version)}`;
    }

    public createPathSortKey(input: Pick<Page, "path"> | string): string {
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

    public createPublishedSortKey(): string {
        return "P";
    }

    public createLatestSortKey(): string {
        return "L";
    }

    public createBasicType(): string {
        return "pb.page";
    }

    public createLatestType(): string {
        return "pb.page.l";
    }

    public createPublishedType(): string {
        return "pb.page.p";
    }

    public createPublishedPathType(): string {
        return "pb.page.p.path";
    }
}
