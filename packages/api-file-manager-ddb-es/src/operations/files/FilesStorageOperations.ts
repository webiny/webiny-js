import {
    File,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateBatchParams,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsDeleteParams,
    FileManagerFilesStorageOperationsGetParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsListResponseMeta,
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
import { configurations } from "~/configurations";
import { encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { createElasticsearchBody } from "~/operations/files/body";
import { transformFromIndex, transformToIndex } from "~/operations/files/transformers";
import { FileIndexTransformPlugin } from "~/plugins/FileIndexTransformPlugin";
import { compress } from "@webiny/api-elasticsearch/compression";
import { get as getEntityItem } from "@webiny/db-dynamodb/utils/get";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import {
    ElasticsearchSearchResponse,
    SearchBody as ElasticsearchSearchBody
} from "@webiny/api-elasticsearch/types";
import { FileManagerContext } from "~/types";

interface FileItem extends File {
    PK: string;
    SK: string;
    TYPE: string;
}

interface EsFileItem {
    PK: string;
    SK: string;
    index: string;
    data: any;
}

interface ConstructorParams {
    context: FileManagerContext;
}

interface CreatePartitionKeyParams {
    id: string;
    locale: string;
    tenant: string;
}

export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    private readonly context: FileManagerContext;
    private readonly table: Table;
    private readonly esTable: Table;
    private readonly entity: Entity<any>;
    private readonly esEntity: Entity<any>;

    private get esClient() {
        const ctx = this.context;
        if (!ctx.elasticsearch) {
            throw new WebinyError(
                "Missing Elasticsearch client on the context.",
                "ELASTICSEARCH_CLIENT_ERROR"
            );
        }
        return ctx.elasticsearch as Client;
    }

    public constructor({ context }: ConstructorParams) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineFilesEntity({
            context,
            table: this.table
        });

        this.esTable = defineEsTable({
            context
        });

        this.esEntity = defineFilesEsEntity({
            context,
            table: this.esTable
        });
    }

    public async get(params: FileManagerFilesStorageOperationsGetParams): Promise<File | null> {
        const { where } = params;
        const keys = {
            PK: this.createPartitionKey(where),
            SK: this.createSortKey()
        };

        try {
            const file = await getEntityItem<File>({
                entity: this.entity,
                keys
            });
            return cleanupItem<File>(this.entity, file);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch requested file.",
                ex.code || "GET_FILE_ERROR",
                {
                    where
                }
            );
        }
    }

    public async create(params: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const { file } = params;

        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey()
        };
        const item: FileItem = {
            ...file,
            ...keys,
            TYPE: "fm.file"
        };
        const esData = await transformToIndex({
            plugins: this.getFileIndexTransformPlugins(),
            file
        });
        const esCompressedData = await compress(this.context.plugins, esData);
        const esItem: EsFileItem = {
            ...keys,
            index: this.getElasticsearchIndex(),
            data: esCompressedData
        };
        try {
            await this.entity.put(item);
            await this.esEntity.put(esItem);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create a new file in the DynamoDB.",
                ex.code || "CREATE_FILE_ERROR",
                {
                    item,
                    esItem
                }
            );
        }

        return file;
    }

    public async update(params: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const { file } = params;

        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey()
        };

        const item: FileItem = {
            ...file,
            ...keys,
            TYPE: "fm.file"
        };
        const esData = await transformToIndex({
            plugins: this.getFileIndexTransformPlugins(),
            file
        });
        const esCompressedData = await compress(this.context.plugins, esData);
        const esItem: EsFileItem = {
            ...keys,
            index: this.getElasticsearchIndex(),
            data: esCompressedData
        };
        try {
            await this.entity.put(item);
            await this.esEntity.put(esItem);
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

    public async delete(params: FileManagerFilesStorageOperationsDeleteParams): Promise<void> {
        const { file } = params;
        const keys = {
            PK: this.createPartitionKey(file),
            SK: this.createSortKey()
        };

        try {
            await this.entity.delete(keys);
            await this.esEntity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete file from the DynamoDB.",
                ex.code || "DELETE_FILE_ERROR",
                {
                    error: ex,
                    file
                }
            );
        }
    }

    public async createBatch(
        params: FileManagerFilesStorageOperationsCreateBatchParams
    ): Promise<File[]> {
        const { files } = params;

        const items = [];
        const esItems = [];

        for (const file of files) {
            const keys = {
                PK: this.createPartitionKey(file),
                SK: this.createSortKey()
            };

            items.push(
                this.entity.putBatch({
                    ...file,
                    ...keys,
                    TYPE: "fm.file"
                })
            );

            const esCompressedData = await compress(this.context.plugins, file);

            esItems.push(
                this.esEntity.putBatch({
                    ...keys,
                    index: this.getElasticsearchIndex(),
                    data: esCompressedData
                })
            );
        }

        try {
            await batchWriteAll({
                table: this.entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch insert a list of files.",
                ex.code || "BATCH_CREATE_FILES_ERROR",
                {
                    error: ex,
                    files
                }
            );
        }

        try {
            await batchWriteAll({
                table: this.esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch insert a list of files into Elasticsearch table.",
                ex.code || "BATCH_CREATE_FILES_ERROR",
                {
                    error: ex,
                    files
                }
            );
        }

        return files;
    }

    public async list(
        params: FileManagerFilesStorageOperationsListParams
    ): Promise<FileManagerFilesStorageOperationsListResponse> {
        const { where, limit, after, sort } = params;

        const body = createElasticsearchBody({
            context: this.context,
            where,
            limit,
            sort,
            after
        });

        let response: ElasticsearchSearchResponse<File>;
        try {
            response = await this.esClient.search({
                index: this.getElasticsearchIndex(),
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
        const plugins = this.getFileIndexTransformPlugins();
        const { hits, total } = response.body.hits;

        const files = await Promise.all(
            hits.map(async item => {
                return await transformFromIndex({
                    plugins,
                    file: item._source
                });
            })
        );

        let hasMoreItems = false;
        if (files.length > limit) {
            files.pop();
            hasMoreItems = true;
        }

        const meta = {
            hasMoreItems,
            totalCount: total.value,
            cursor: files.length > 0 ? encodeCursor(hits[files.length - 1].sort) || null : null
        };

        return [files, meta];
    }
    public async tags(
        params: FileManagerFilesStorageOperationsTagsParams
    ): Promise<FileManagerFilesStorageOperationsTagsResponse> {
        const { where, limit } = params;

        const initialBody = createElasticsearchBody({
            context: this.context,
            where,
            limit,
            sort: [],
            after: undefined
        });

        const body: ElasticsearchSearchBody = {
            ...initialBody,
            aggs: {
                listTags: {
                    terms: {
                        field: "tags.keyword"
                    }
                }
            }
        };

        let response: ElasticsearchSearchResponse<string> | undefined = undefined;

        try {
            response = await this.esClient.search({
                index: this.getElasticsearchIndex(),
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

        const listTags = response.body.aggregations["listTags"] || { buckets: [] };

        const tags = listTags.buckets.map(item => item.key) || [];

        let hasMoreItems = false;
        const totalCount = tags.length;
        if (totalCount > limit + 1) {
            tags.pop();
            hasMoreItems = true;
        }

        const meta: FileManagerFilesStorageOperationsListResponseMeta = {
            hasMoreItems,
            totalCount,
            cursor: null
        };

        return [tags, meta];
    }

    private createPartitionKey(params: CreatePartitionKeyParams): string {
        const { tenant, locale, id } = params;
        return `T#${tenant}#L#${locale}#FM#F${id}`;
    }

    private createSortKey(): string {
        return "A";
    }

    private getFileIndexTransformPlugins(): FileIndexTransformPlugin[] {
        return this.context.plugins.byType<FileIndexTransformPlugin>(FileIndexTransformPlugin.type);
    }

    private getElasticsearchIndex(): string {
        const locale = this.context.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing content locale in FilesStorageOperations.",
                "LOCALE_ERROR"
            );
        }
        const { index } = configurations.es({
            tenant: this.context.tenancy.getCurrentTenant().id,
            locale: locale.code
        });
        return index;
    }
}
