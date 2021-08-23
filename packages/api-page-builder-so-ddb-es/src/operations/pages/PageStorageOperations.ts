import {
    Page,
    PageStorageOperations,
    PageStorageOperationsGetParams,
    PageStorageOperationsListParams,
    PageStorageOperationsListResponse,
    PbContext
} from "@webiny/api-page-builder/types";
import { Entity, Table } from "dynamodb-toolbox";
import { defineTable } from "~/definitions/table";
import { definePageEntity } from "~/definitions/pageEntity";
import WebinyError from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import configurations from "~/operations/configurations";
import { encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { createElasticsearchQueryBody } from "./elasticsearchQueryBody";

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

export class PageStorageOperationsDdbEs implements PageStorageOperations {
    private readonly context: PbContext;
    private readonly elasticsearch: Client;
    public readonly table: Table;
    public readonly entity: Entity<any>;

    public constructor({ context }: Params) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = definePageEntity({
            context,
            table: this.table
        });

        this.elasticsearch = getElasticsearchClient(context);
    }

    public async get(params: PageStorageOperationsGetParams): Promise<Page | null> {
        const { where } = params;
        const { pid, version, id } = where;
        /**
         * Depending on if version was passed we load given record.
         * If version was passed we load the specific record.
         * If version was not passed we load the last record.
         */
        const keys = {
            PK: this.createPartitionKey(id || pid),
            SK: version ? this.createSortKey(version) : this.createLatestSortKey()
        };
        try {
            const item = await this.entity.get(keys);

            return cleanupItem(this.entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page by given params.",
                ex.code || "GET_PAGE_ERROR",
                {
                    where
                }
            );
        }
    }

    public async list(
        params: PageStorageOperationsListParams
    ): Promise<PageStorageOperationsListResponse> {
        const { limit: initialLimit } = params;

        const limit = createLimit(initialLimit, 50);
        const body = createElasticsearchQueryBody({
            ...params,
            limit,
            context: this.context
        });

        let response;
        const esConfig = configurations.es(this.context);
        try {
            response = await this.elasticsearch.search({
                ...esConfig,
                body
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load page by given params.",
                ex.code || "GET_PAGE_ERROR",
                {
                    params
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
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null;
        return [
            items,
            {
                hasMoreItems,
                totalCount: total.value,
                cursor
            }
        ];
    }

    private createPartitionKey(id: string): string {
        if (id.includes("#")) {
            id = id.split("#").shift();
        }
        return `T#${this.context.tenancy.getCurrentTenant().id}#L${
            this.context.i18nContent.getLocale().code
        }#PB#P${id}`;
    }

    private createSortKey(version: string): string {
        if (version.includes("#")) {
            version = version.split("#").pop();
        }
        return `REV#${version};`;
    }

    private createPublishedSortKey(): string {
        return "P";
    }

    private createLatestSortKey(): string {
        return "L";
    }
}
