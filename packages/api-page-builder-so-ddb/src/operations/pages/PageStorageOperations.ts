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
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { decodeCursor, encodeCursor } from "@webiny/db-dynamodb/utils/cursor";
import { PageDynamoDbFieldPlugin } from "~/plugins/definitions/PageDynamoDbFieldPlugin";

interface Params {
    context: PbContext;
}

interface EntityKeys {
    PK: string;
    SK: string | number;
}

type DbRecord<T> = T & { PK: string; SK: string; TYPE: string };

const GSI1_INDEX = "GSI1";

/**
 * To be able to efficiently query pages we need the following records in the database:
 * - latest
 *      PK - fixed string + #L
 *      SK - pageId
 * - revision
 *      PK - fixed string + pageId
 *      SK - version
 * - published
 *      PK - fixed string + #P
 *      SK - pageId
 * - path
 *      PK - fixed string + #PATH
 *      SK - path
 */
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

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);

        const titleLC = page.title.toLowerCase();
        /**
         * We need to create
         * - latest
         * - revision
         */
        const items = [
            this.entity.putBatch({
                ...page,
                titleLC,
                ...latestKeys,
                TYPE: this.createLatestType()
            }),
            this.entity.putBatch({
                ...page,
                titleLC,
                ...revisionKeys,
                TYPE: this.createRevisionType()
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
                    revisionKeys,
                    latestKeys,
                    page
                }
            );
        }
    }

    public async createFrom(params: PageStorageOperationsCreateFromParams): Promise<Page> {
        const { page, latestPage, original } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);
        /**
         * We need to create
         * - latest
         * - revision
         */
        const items = [
            this.entity.putBatch({
                ...page,
                ...latestKeys,
                TYPE: this.createLatestType()
            }),
            this.entity.putBatch({
                ...page,
                ...revisionKeys,
                TYPE: this.createRevisionType()
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
                    revisionKeys,
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

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);

        const latestPageResult = await this.entity.get(latestKeys);
        const latestPage = cleanupItem(
            this.entity,
            latestPageResult ? latestPageResult.Item : null
        );

        const titleLC = page.title.toLowerCase();
        /**
         * We need to update
         * - revision
         * - latest if this is the latest
         */
        const items = [
            this.entity.putBatch({
                ...page,
                titleLC,
                ...revisionKeys,
                TYPE: this.createRevisionType()
            })
        ];
        /**
         * Latest if it is the one.
         */
        if (latestPage && latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    titleLC,
                    ...latestKeys,
                    TYPE: this.createLatestType()
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
                    revisionKeys
                }
            );
        }
    }
    public async delete(params: PageStorageOperationsDeleteParams): Promise<[Page, Page | null]> {
        const { page, latestPage, publishedPage } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const publishedKeys = this.createPublishedKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);

        /**
         * We need to delete
         * - revision
         * - published if is published
         * We need to update
         * - latest, if it exists, with previous record
         */
        const items = [this.entity.deleteBatch(revisionKeys)];
        if (publishedPage && publishedPage.id === page.id) {
            items.push(this.entity.deleteBatch(publishedKeys));
        }
        let previousLatestPage: Page = null;
        if (latestPage && latestPage.id === page.id) {
            const partitionKey = this.createRevisionPartitionKey(page.id);
            const previousLatestRecord = await queryOne<DbRecord<Page>>({
                entity: this.entity,
                partitionKey,
                options: {
                    lt: String(this.createRevisionSortKey(latestPage.version)),
                    reverse: true
                }
            });
            if (previousLatestRecord) {
                items.push(
                    this.entity.putBatch({
                        ...previousLatestRecord,
                        ...latestKeys,
                        TYPE: this.createLatestType()
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
     * We need to delete
     * - latest
     * - published
     * - path
     * - all revisions
     */
    public async deleteAll(params: PageStorageOperationsDeleteAllParams): Promise<[Page]> {
        const { page } = params;

        const partitionKey = this.createRevisionPartitionKey(page.id);
        const queryAllParams = {
            entity: this.entity,
            partitionKey,
            options: {
                gte: " "
            }
        };

        const items = [this.entity.deleteBatch(this.createLatestKeys(page.id))];

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

        let deletedPublishedRecord = false;
        /**
         * We need to go through all possible entries and delete them.
         * Also, delete the published entry path record.
         */
        for (const revision of revisions) {
            if (!deletedPublishedRecord && revision.status === "published") {
                items.push(this.entity.deleteBatch(this.createPublishedKeys(revision.id)));
                deletedPublishedRecord = true;
            }
            items.push(this.entity.deleteBatch(this.createRevisionKeys(revision.id)));
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
     * We need to
     * - update revision that it is published
     * - if is latest update record that it is published
     * - set status of previously published page to unpublished
     * - create / update published record
     * - create / update published path
     */
    public async publish(params: PageStorageOperationsPublishParams): Promise<Page> {
        const { page, latestPage, publishedPage } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);
        const publishedKeys = this.createPublishedKeys(page.id);
        /**
         * Update the given revision of the page.
         */
        const items = [
            this.entity.putBatch({
                ...page,
                ...revisionKeys,
                TYPE: this.createRevisionType()
            })
        ];

        if (latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    ...latestKeys,
                    TYPE: this.createLatestType()
                })
            );
        }
        /**
         * If we have already published revision of this page:
         *  - set existing published page revision to unpublished
         */
        if (publishedPage) {
            const publishedRevisionKeys = this.createRevisionKeys(publishedPage.id);
            items.push(
                this.entity.putBatch({
                    ...publishedPage,
                    status: "unpublished",
                    ...publishedRevisionKeys,
                    TYPE: this.createRevisionType()
                })
            );
        }

        items.push(
            this.entity.putBatch({
                ...page,
                ...publishedKeys,
                GSI1_PK: this.createPathPartitionKey(),
                GSI1_SK: page.path,
                TYPE: this.createPublishedType()
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
    /**
     * We need to
     * - update revision record with new status
     * - remove published record
     * - remove published path record
     * - update latest record with new status if is the latest
     */
    public async unpublish(params: PageStorageOperationsUnpublishParams): Promise<Page> {
        const { page, latestPage } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);
        const publishedKeys = this.createPublishedKeys(page.id);

        const items = [
            this.entity.putBatch({
                ...page,
                ...revisionKeys,
                TYPE: this.createRevisionType()
            }),
            this.entity.deleteBatch(publishedKeys)
        ];

        if (latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    ...latestKeys,
                    TYPE: this.createLatestType()
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
     * We need to
     * - update revision record
     * - update latest record if it is the latest record
     */
    public async requestReview(params: PageStorageOperationsRequestReviewParams): Promise<Page> {
        const { original, page, latestPage } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);

        const items = [
            this.entity.putBatch({
                ...page,
                ...revisionKeys,
                TYPE: this.createRevisionType()
            })
        ];
        if (latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    ...latestKeys,
                    TYPE: this.createLatestType()
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
    /**
     * We need to
     * - update revision record
     * - update latest record if it is the latest one
     */
    public async requestChanges(params: PageStorageOperationsRequestChangesParams): Promise<Page> {
        const { original, page, latestPage } = params;

        const revisionKeys = this.createRevisionKeys(page.id);
        const latestKeys = this.createLatestKeys(page.id);

        const items = [
            this.entity.putBatch({
                ...page,
                ...revisionKeys,
                TYPE: this.createRevisionType()
            })
        ];
        if (latestPage.id === page.id) {
            items.push(
                this.entity.putBatch({
                    ...page,
                    ...latestKeys,
                    TYPE: this.createLatestType()
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
        let keys: EntityKeys;
        if (path) {
            return this.getByPath(path);
        } else if (!id && !pid) {
            throw new WebinyError("There are no ID or pageId.", "MALFORMED_GET_REQUEST", {
                where
            });
        } else if (published) {
            keys = this.createPublishedKeys(pid || id);
        } else if (version) {
            keys = {
                PK: this.createRevisionPartitionKey(pid || id),
                SK: this.createRevisionSortKey(version)
            };
        } else {
            keys = this.createLatestKeys(pid || id);
        }
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

    private async getByPath(path: string): Promise<Page | null> {
        const keys = this.createPathKeys(path);

        const queryOptions: QueryAllParams = {
            entity: this.entity,
            partitionKey: keys.PK,
            options: {
                index: GSI1_INDEX,
                eq: keys.SK
            }
        };
        try {
            const result = await queryOne<DbRecord<Page>>(queryOptions);
            if (!result) {
                return null;
            }
            return cleanupItem(this.entity, result);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get page by given path.",
                ex.code || "GET_PAGE_BY_PATH_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async list(
        params: PageStorageOperationsListParams
    ): Promise<PageStorageOperationsListResponse> {
        const { where: initialWhere } = params;

        const { latest, published } = initialWhere;
        /**
         * We do not allow loading both published and latest at the same time.
         * @see PageStorageOperationsListWhere
         */
        if (published && latest) {
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
            gte: " "
        };

        const { tags_in: tags, tags_rule: tagsRule, search } = initialWhere;

        const where: any = {
            ...initialWhere
        };
        delete where.search;
        delete where.tags_in;
        delete where.tags_rule;
        delete where.tenant;
        delete where.locale;
        delete where.latest;
        delete where.published;
        if (tags && tags.length > 0) {
            if (tagsRule === "any") {
                where.tags_in = tags;
            } else {
                where.tags_and_in = tags;
            }
        }
        if (search) {
            /**
             * We need to pass fuzzy into where so we need to cast it as where because it does not exist on the original type
             */
            where.fuzzy = {
                fields: ["title", "snippet"],
                value: search
            };
        }

        let partitionKey: string;
        if (published) {
            partitionKey = this.createPublishedPartitionKey();
            //
            where.listPublished_not = false;
        } else {
            partitionKey = this.createLatestPartitionKey();
            where.listLatest_not = false;
        }

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
            where,
            fields
        }).map(item => {
            return cleanupItem<Page>(this.entity, item);
        });

        const sortedPages = sortItems<Page>({
            items: filteredPages,
            sort: params.sort,
            fields
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
            partitionKey: this.createRevisionPartitionKey(params.where.pid),
            options: {
                gte: " ",
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

        const options: QueryAllParams["options"] = {
            gte: " "
        };

        const partitionKey = this.createLatestPartitionKey();

        const queryAllParams: QueryAllParams = {
            entity: this.entity,
            partitionKey,
            options
        };

        let pages: DbRecord<Page>[] = [];
        try {
            pages = await queryAll<DbRecord<Page>>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load pages by given query params.",
                ex.code || "LIST_PAGES_TAGS_ERROR",
                {
                    partitionKey,
                    options
                }
            );
        }

        const tags = pages.reduce((collection, page) => {
            let list = lodashGet(page, "settings.general.tags");
            if (!list || list.length === 0) {
                return collection;
            } else if (where.search) {
                const re = new RegExp(where.search, "i");
                list = list.filter(t => t.match(re) !== null);
            }

            for (const t of list) {
                collection[t] = undefined;
            }
            return collection;
        }, {});

        return Object.keys(tags);
    }
    /**
     * Used in multiple partition keys.
     */
    private createBasePartitionKey(): string {
        const tenant = this.context.tenancy.getCurrentTenant().id;
        const locale = this.context.i18nContent.getLocale().code;
        return `T#${tenant}#L#${locale}#PB`;
    }

    private createPublishedPartitionKey(): string {
        return `${this.createBasePartitionKey()}#P`;
    }

    private createLatestPartitionKey(): string {
        return `${this.createBasePartitionKey()}#L`;
    }

    private createPathPartitionKey(): string {
        return `${this.createBasePartitionKey()}#PATH`;
    }

    private createRevisionPartitionKey(id: string): string {
        if (id.includes("#") === true) {
            id = id.split("#").shift();
        }
        return `${this.createBasePartitionKey()}#${id}`;
    }

    private createRevisionKeys(id: string): EntityKeys {
        return {
            PK: this.createRevisionPartitionKey(id),
            SK: this.createRevisionSortKey(id)
        };
    }

    private createRevisionSortKey(version: string | number): number {
        if (typeof version === "number") {
            return Number(version);
        } else if (typeof version === "string") {
            if (version.includes("#")) {
                const v = version.split("#").pop();
                return Number(v);
            }
            return Number(version);
        }

        throw new WebinyError(
            "You can only pass number or a ID string.",
            "MALFORMED_VERSION_VALUE",
            {
                version
            }
        );
    }

    private createPublishedSortKey(id: string): string {
        if (id.includes("#") === true) {
            id = id.split("#").shift();
        }
        return id;
    }

    private createLatestSortKey(id: string): string {
        if (id.includes("#") === true) {
            id = id.split("#").shift();
        }
        return id;
    }
    /**
     * Type that marks revision page record.
     */
    private createRevisionType(): string {
        return "pb.page";
    }
    /**
     * Type that marks latest page record.
     */
    private createLatestType(): string {
        return "pb.page.l";
    }
    /**
     * Type that marks published page record.
     */
    private createPublishedType(): string {
        return "pb.page.p";
    }

    private createLatestKeys(id: string): EntityKeys {
        return {
            PK: this.createLatestPartitionKey(),
            SK: this.createLatestSortKey(id)
        };
    }

    private createPublishedKeys(id: string): EntityKeys {
        return {
            PK: this.createPublishedPartitionKey(),
            SK: this.createPublishedSortKey(id)
        };
    }

    private createPathKeys(path: string): EntityKeys {
        return {
            PK: this.createPathPartitionKey(),
            SK: path
        };
    }
}
