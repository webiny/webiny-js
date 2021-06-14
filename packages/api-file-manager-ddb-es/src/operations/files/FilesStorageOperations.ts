import {
    File,
    FileManagerContext,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Client } from "@elastic/elasticsearch";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineTable from "~/definitions/table";
import defineEsTable from "~/definitions/tableElasticsearch";
import defineFilesEntity from "~/definitions/filesEntity";
import defineFilesEsEntity from "~/definitions/filesElasticsearchEntity";
import configurations from "~/operations/configurations";
import lodashOmit from "lodash.omit";
import lodashChunk from "lodash.chunk";
import { decodeCursor, encodeCursor } from "~/operations/utils";

interface FileItem extends File {
    PK: string;
    SK: string;
    TYPE: string;
}

interface EsFileItem {
    PK: string;
    SK: string;
    index: string;
    data: File;
}

interface ConstructorParams {
    context: FileManagerContext;
}

const SORT_KEY = "A";

/**
 * This is required due to sometimes file data sent is from the DynamoDB and we want to remove the unnecessary stuff.
 */
const cleanStorageFile = (file: File & Record<string, any>): File => {
    return lodashOmit(file, ["PK", "SK", "TYPE"]);
};

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly _context: any;
    private _partitionKeyPrefix: string;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;
    private readonly _esEntity: Entity<any>;
    private _esIndex: string;

    private get context(): FileManagerContext {
        return this._context;
    }

    private get esIndex(): string {
        if (!this._esIndex) {
            const { index: esIndex } = configurations.es(this.context);
            this._esIndex = esIndex;
        }
        return this._esIndex;
    }

    private get esClient() {
        const ctx = this.context as any;
        if (!ctx.elasticSearch) {
            throw new WebinyError(
                "Missing Elasticsearch client on the context.",
                "ELASTICSEARCH_CLIENT_ERROR"
            );
        }
        return ctx.elasticSearch as Client;
    }

    private get partitionKeyPrefix(): string {
        if (!this._partitionKeyPrefix) {
            const tenant = this.context.security.getTenant();
            const locale = this.context.i18nContent.getLocale();
            if (!tenant) {
                throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
            }
            if (!locale) {
                throw new Error("Locale missing.");
            }
            this._partitionKeyPrefix = `T#${tenant.id}#L#${locale.code}#FM`;
        }
        return this._partitionKeyPrefix;
    }

    public constructor({ context }: ConstructorParams) {
        this._context = context;
        this._table = defineTable({
            context
        });

        this._entity = defineFilesEntity({
            context,
            table: this._table
        });

        const esTable = defineEsTable({
            context
        });

        this._esEntity = defineFilesEsEntity({
            context,
            table: esTable
        });
    }

    public async get(id: string): Promise<File | null> {
        try {
            const file = await this._entity.get({
                PK: this.getPartitionKey(id),
                SK: SORT_KEY
            });
            return cleanStorageFile(file) || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch requested file.",
                ex.code || "GET_FILE_ERROR",
                {
                    id
                }
            );
        }
    }

    public async create(params: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const { file } = params;

        const keys = {
            PK: this.getPartitionKey(file.id),
            SK: SORT_KEY
        };
        const item: FileItem = {
            ...keys,
            TYPE: "fm.file",
            ...file
        };
        const esItem: EsFileItem = {
            ...keys,
            index: this.esIndex,
            data: file
        };
        try {
            await this._table.batchWrite([item, esItem]);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file to the DynamoDB.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    item,
                    esItem
                }
            );
        }

        return file;
    }

    public async update({ file }: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const keys = {
            PK: this.getPartitionKey(file.id),
            SK: SORT_KEY
        };

        const item: FileItem = {
            ...keys,
            TYPE: "fm.file",
            ...file
        };
        const esItem: EsFileItem = {
            ...keys,
            index: this.esIndex,
            data: file
        };
        try {
            await this._table.batchWrite([item, esItem]);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update a file in the DynamoDB.",
                ex.code || "UPDATE_FILE_ERROR",
                {
                    item,
                    esItem
                }
            );
        }
        return file;
    }

    public async delete(id: string): Promise<void> {
        const keys = {
            PK: this.getPartitionKey(id),
            SK: SORT_KEY
        };

        try {
            await this._table.batchWrite([
                this._entity.deleteBatch(keys),
                this._esEntity.deleteBatch(keys)
            ]);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete file from the DynamoDB.",
                ex.code || "DELETE_FILE_ERROR",
                {
                    id
                }
            );
        }
    }

    public async createBatch({ files }): Promise<File[]> {
        const fileChunks = lodashChunk(files, 12);

        for (const fileChunk of fileChunks) {
            const batches = [];
            for (const file of fileChunk) {
                const keys = {
                    PK: this.getPartitionKey(file.id),
                    SK: SORT_KEY
                };
                batches.push(
                    this._entity.putBatch({
                        ...keys,
                        TYPE: "fm.file",
                        ...file
                    })
                );
                batches.push(
                    this._esEntity.putBatch({
                        ...keys,
                        index: this.esIndex,
                        data: file
                    })
                );
            }
            try {
                await this._table.batchWrite(batches);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not batch insert a list of files.",
                    ex.code || "BATCH_CREATE_FILES_ERROR",
                    {
                        files: fileChunk,
                        items: batches
                    }
                );
            }
        }
        return files;
    }

    public async list(
        params: FileManagerFilesStorageOperationsListParams
    ): Promise<FileManagerFilesStorageOperationsListResponse> {
        const { security } = this.context;

        const { where, limit, after } = params;

        const must: any[] = [];

        if (where.private !== undefined) {
            must.push({ term: { "meta.private": where.private } });
        }

        if (where.locale) {
            must.push({ term: { "locale.keyword": where.locale } });
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        if (sharedIndex) {
            const tenant = security.getTenant();
            must.push({ term: { "tenant.keyword": tenant.id } });
        }

        if (where.createdBy) {
            must.push({ term: { "createdBy.id.keyword": where.createdBy } });
        }

        if (where.type_in) {
            must.push({ terms: { "type.keyword": where.type_in } });
        }

        if (where.search) {
            must.push({
                bool: {
                    should: [
                        { wildcard: { name: `*${where.search}*` } },
                        { terms: { tags: where.search.toLowerCase().split(" ") } }
                    ]
                }
            });
        }

        if (where.tag_in) {
            must.push({
                terms: { "tags.keyword": where.tag_in }
            });
        }

        if (where.id_in) {
            must.push({
                terms: { "id.keyword": where.id_in }
            });
        }

        const body = {
            query: {
                constant_score: {
                    filter: {
                        bool: {
                            must: must
                        }
                    }
                }
            },
            size: limit + 1,
            search_after: after ? decodeCursor(after) : undefined,
            sort: [{ "id.keyword": "desc" }]
        };

        let response;
        try {
            response = await this.esClient.search({
                ...configurations.es(this.context),
                body
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not search for the files.",
                ex.code || "FILE_LIST_ERROR",
                {
                    where,
                    esBody: body
                }
            );
        }

        const { hits, total } = response.body.hits;
        const files = hits.map(item => item._source);

        let hasMoreItems = false;
        if (files.length > limit + 1) {
            files.pop();
            hasMoreItems = true;
        }

        const meta = {
            hasMoreItems,
            totalCount: total.value,
            cursor: files.length > 0 ? encodeCursor(hits[files.length - 1].sort) : null
        };

        return [files, meta];
    }
    public async tags(
        params: FileManagerFilesStorageOperationsTagsParams
    ): Promise<FileManagerFilesStorageOperationsTagsResponse> {
        const { security } = this.context;
        const { where, limit } = params;

        const esDefaults = configurations.es(this.context);

        const must: any[] = [];
        if (where.locale) {
            must.push({ term: { "locale.keyword": where.locale } });
        }

        // When ES index is shared between tenants, we need to filter records by tenant ID
        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        if (sharedIndex) {
            const tenant = security.getTenant();
            must.push({ term: { "tenant.keyword": tenant.id } });
        }

        const body = {
            query: {
                bool: {
                    must
                }
            },
            size: limit + 1,
            aggs: {
                listTags: {
                    terms: { field: "tags.keyword" }
                }
            }
            // search_after: decodeCursor(after)
        };

        let response = undefined;

        try {
            response = await this.esClient.search({
                ...esDefaults,
                body
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Error in the Elasticsearch query.",
                ex.code || "ELASTICSEARCH_ERROR",
                {
                    body
                }
            );
        }

        const tags = response.body.aggregations.listTags.buckets.map(item => item.key) || [];

        let hasMoreItems = false;
        const totalCount = tags.length;
        if (totalCount > limit + 1) {
            tags.pop();
            hasMoreItems = true;
        }

        const meta = {
            hasMoreItems,
            totalCount,
            cursor: null //tags.length > 0 ? encodeCursor(hits[files.length - 1].sort) : null
        };

        return [tags, meta];
    }

    /**
     * Create the partition key for the file.
     */
    private getPartitionKey(id: string): string {
        return `${this.partitionKeyPrefix}#F#${id}`;
    }
}
